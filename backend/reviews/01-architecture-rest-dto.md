# Kiến thức 1 — Kiến trúc tầng, REST và DTO

## Kiến thức

- **Controller** là adapter HTTP: nhận request, validate DTO, áp dụng authorization và gọi service.
- **Facade service** điều phối use case; domain service nắm logic nghiệp vụ; **repository** giao tiếp database.
- DTO tạo ranh giới giữa hợp đồng API và mô hình lưu trữ. Tên cột DB, cách lưu password hoặc cách phân trang nội bộ không nên tự động trở thành API contract.
- Với REST thông dụng, lấy danh sách/tìm kiếm là `GET /resource` với query parameters; không cần một HTTP method riêng tên `QUERY`.

## Nhận xét từ code

**Điểm tốt**

- [StudentController.java](../src/main/java/com/example/api/controller/StudentController.java#L26) chủ yếu định tuyến, validate, gắn `@PreAuthorize` và gọi `StudentService`; không có truy vấn DB hoặc nghiệp vụ lớn trong controller.
- [StudentService.java](../src/main/java/com/example/api/service/StudentService.java#L17) làm facade cho domain query/command và chuyển `StudentRecord` thành response DTO.
- Request/response DTO nằm riêng; controller không trả trực tiếp jOOQ `Record` hay tài khoản chứa password hash.
- Tài nguyên được đặt là `students`, không lấy tên ví dụ `requests`. CRUD routes có dạng `GET /api/students`, `GET /api/students/{id}`, `POST /api/students`, `PATCH /api/students/{id}`, `DELETE /api/students/{id}`. Tìm kiếm đi qua GET query parameters.

## Finding

### Cao (P1, nếu frontend hiện tại là client của backend Java) — Frontend chưa nói cùng API contract

[database.js](../../frontend/js/database.js#L3) vẫn gọi `http://127.0.0.1:8000/api/students/`, trong khi backend mặc định ở cổng `8080`. Frontend gửi snake_case như `full_name` ([database.js](../../frontend/js/database.js#L26)) và đọc định dạng Django `results`, `total_records`, `current_page` ([database.js](../../frontend/js/database.js#L76)); Java API nhận camelCase DTO và trả `content`, `totalElements`, `page`. Frontend cũng dùng `page_size`/`ordering` thay vì `size`/`sortBy`/`sortDirection` ([database.js](../../frontend/js/database.js#L48)), không gửi Bearer token, gọi `PUT` không được backend cung cấp ([database.js](../../frontend/js/database.js#L121)), và thêm slash cuối route. Backend hiện cũng chưa cấu hình CORS cho frontend chạy ở origin khác. Nếu giao diện này cần chạy với backend Java, các lời gọi hiện tại sẽ không hoạt động đồng bộ; cần một thay đổi tích hợp client/API riêng.

## Đánh giá

Backend tuân theo yêu cầu tách controller, service, repository và DTO. Endpoint tìm kiếm được mô hình hóa hợp lý bằng GET/query; không cần đổi sang `QUERY` hoặc đổi tên resource. Điểm tích hợp frontend là khác biệt quan trọng nhất nếu phạm vi review bao gồm cả ứng dụng chạy end-to-end.
