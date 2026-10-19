# Kiến thức 3 — Validation, exception handling và HTTP status

## Kiến thức

- Validate request ở ranh giới HTTP để từ chối dữ liệu sai trước khi chạy nghiệp vụ.
- Dùng exception nghiệp vụ có status rõ cho các trường hợp như not found/conflict/unauthorized.
- Global handler cần chuẩn hóa body và giữ đúng status; lỗi không xác định phải trả 500, còn route/tài nguyên không tồn tại phải trả 404.
- Với validation nhiều trường, response nên chỉ rõ trường nào sai để client có thể sửa request.

## Nhận xét từ code

**Điểm tốt**

- DTO đăng ký/login/sinh viên có giới hạn độ dài, định dạng email, giá trị dương và trường bắt buộc; controller kích hoạt validation bằng `@Valid`.
- [StudentPatchRequest.java](../src/main/java/com/example/api/dto/request/StudentPatchRequest.java#L15) và [StudentValidator.java](../src/main/java/com/example/api/service/domain/student/StudentValidator.java#L28) từ chối PATCH rỗng và text rỗng.
- `ApiException` cung cấp status nghiệp vụ; `GlobalExceptionHandler` tạo một schema lỗi chung và log exception không dự kiến.
- Duplicate ISU ID trả 409, thiếu sinh viên trả 404, quyền bị từ chối trả 403 trong luồng đã kiểm thử.

## Findings

### Trung bình (P2) — Route không tồn tại có nguy cơ bị trả thành 500

[GlobalExceptionHandler.java](../src/main/java/com/example/api/exception/GlobalExceptionHandler.java#L56) bắt mọi `Exception` còn lại và ánh xạ thành `INTERNAL_SERVER_ERROR`. Handler không phân loại rõ `NoResourceFoundException`/trường hợp không tìm thấy route hoặc resource của Spring MVC. Nếu lỗi đó đi tới handler tổng quát, client nhận 500 thay vì 404, trái với semantics HTTP. Nên thêm handler riêng cho route/resource không tồn tại và kiểm thử request tới URL không được map.

### Thấp (P3) — Một số lỗi validation không nêu trường gây lỗi

`MethodArgumentNotValidException` trả map theo field, nhưng [handleConstraintViolation](../src/main/java/com/example/api/exception/GlobalExceptionHandler.java#L45) luôn trả `Map.of()`. Với lỗi constraint trên method parameter (ví dụ path id), client chỉ nhận thông báo chung mà không biết parameter sai. Có thể chuyển `ConstraintViolation` thành map `propertyPath -> message`.

### Thấp (P3) — DTO PATCH dùng null làm sentinel nên contract cập nhật chưa phân biệt đủ

Việc PATCH `notes: null` không thể xóa notes về SQL NULL; chi tiết ở [review CRUD/jOOQ](02-student-jooq-database.md). Nên mô tả rõ semantics hoặc dùng kiểu biểu diễn phân biệt “bỏ qua” với “xóa”.

## Đánh giá

Lõi validation và JSON lỗi đã có. Cần bổ sung kiểm thử cho malformed JSON, query/path validation, route không tồn tại, token sai và các lỗi DB để đảm bảo mọi nhánh giữ status nhất quán.
