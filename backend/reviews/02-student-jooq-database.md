# Kiến thức 2 — CRUD, truy vấn jOOQ và tính toàn vẹn dữ liệu

## Kiến thức

- Repository chịu trách nhiệm tạo/trả dữ liệu; domain command/query service điều phối hành vi nghiệp vụ.
- Query có filter và pagination nên dùng bind values, giới hạn sort field được phép và có thứ tự ổn định.
- Kiểm tra trùng ở service giúp trả lỗi dễ hiểu, nhưng chỉ unique constraint/index ở DB mới bảo vệ được khi nhiều request ghi đồng thời.
- Migration áp dụng lên dữ liệu đã tồn tại phải tương thích với dữ liệu đó; thêm unique index có thể thất bại nếu dữ liệu cũ vi phạm uniqueness.

## Nhận xét từ code

**Điểm tốt**

- [StudentRepository.java](../src/main/java/com/example/api/service/domain/student/StudentRepository.java#L43) dùng `DSLContext` cho truy vấn danh sách, count, insert, update và delete.
- Tên cột sort được ánh xạ qua whitelist trong [sortField](../src/main/java/com/example/api/service/domain/student/StudentRepository.java#L167), không ghép trực tiếp input người dùng vào SQL.
- Giá trị tìm kiếm được truyền qua API jOOQ; wildcard `%`, `_` và escape character được xử lý tại [escapeLike](../src/main/java/com/example/api/service/domain/student/StudentRepository.java#L190).
- Page/size có validation DTO và offset được tính bằng `long` trước khi chuyển sang `int`.
- ISU ID được kiểm tra trước khi ghi trong [StudentValidator.java](../src/main/java/com/example/api/service/domain/student/StudentValidator.java#L16) và có unique index ở migration [SQLite V2](../src/main/resources/db/migration/V2__unique_student_isu_id.sql#L1) lẫn [PostgreSQL V2](../src/main/resources/db/migration-postgresql/V2__unique_student_isu_id.sql#L1); điều này bảo vệ cả trường hợp tranh chấp giữa request.

## Findings

### Trung bình (P2) — Unique-index migration có thể dừng nâng cấp DB cũ

Schema ban đầu [SQLite V1](../src/main/resources/db/migration/V1__init_schema.sql#L12) và [PostgreSQL V1](../src/main/resources/db/migration-postgresql/V1__init_schema.sql#L10) không đặt unique constraint cho `students.isu_id`; unique index chỉ được tạo ở V2. Nếu DB hiện có ISU ID trùng, Flyway sẽ không thể áp dụng V2 và ứng dụng dừng khởi động. Trước khi triển khai V2 trên dữ liệu thật cần kiểm tra/dọn duplicate và có kế hoạch sao lưu.

### Thấp (P3) — Phân trang có thể không ổn định khi giá trị sort bị trùng

Repository chỉ sort theo field đã chọn, ví dụ `groupName`, không thêm `id` làm tie-breaker ([StudentRepository.java](../src/main/java/com/example/api/service/domain/student/StudentRepository.java#L167)). Nhiều dòng cùng giá trị sort có thể đổi thứ tự giữa các request, khiến dữ liệu trùng/lọt giữa các trang khi DB thay đổi. Nên nối thêm `id` làm thứ tự phụ để phân trang ổn định.

### Thấp (P3) — PATCH không thể xóa `notes` thành SQL NULL

Trong [StudentPatchRequest.java](../src/main/java/com/example/api/dto/request/StudentPatchRequest.java#L13), `notes == null` vừa có nghĩa là trường không được gửi, vừa có nghĩa JSON gửi `null`; [StudentRepository.update](../src/main/java/com/example/api/service/domain/student/StudentRepository.java#L95) chỉ cập nhật khi giá trị khác null. API có thể đặt notes thành chuỗi rỗng nhưng không thể biểu đạt riêng “xóa giá trị thành NULL”. Nếu contract cần semantics đó, cần phân biệt field bị thiếu với field có giá trị null.

## Đánh giá

Phần truy cập dữ liệu đáp ứng yêu cầu jOOQ và có biện pháp tốt cho lọc, sort an toàn, uniqueness. Rủi ro lớn nhất là khả năng tương thích dữ liệu cũ khi áp dụng migration V2; đó là điều kiện triển khai cần xác nhận.
