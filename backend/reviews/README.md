# Backend code review

**Thời điểm rà soát:** 2026-10-17  
**Phạm vi:** backend Java/Spring Boot, REST API, DTO/validation, jOOQ repositories, authentication/authorization, Flyway, OpenAPI, Postman, integration test và điểm nối frontend.  
**Cách đọc:** mỗi tài liệu dưới đây ghép một kiến thức với nhận xét về chức năng tương ứng trong repository. Đây là review, không phải các thay đổi implementation.

## Tóm tắt

| Chủ đề | Đánh giá |
|---|---|
| Kiến trúc tầng và hợp đồng API | Controller/facade/domain được phân lớp hợp lý; frontend hiện chưa tương thích với API Java nếu đó là client dự định sử dụng. |
| CRUD, jOOQ và dữ liệu | Query dùng jOOQ, có whitelist sort và kiểm tra trùng ISU ID; cần lưu ý dữ liệu cũ khi áp dụng unique-index migration. |
| Validation và lỗi | DTO có validation và response lỗi chung; một số loại lỗi/validation vẫn thiếu chi tiết hoặc có thể trả sai HTTP status. |
| Auth, JWT và RBAC | BCrypt, token type riêng, refresh-token hash/rotation và phân quyền theo role hiện tại đã có; logout/revocation chủ động chưa có API. |
| OpenAPI, Postman và test | Swagger và collection Postman có các luồng chính; test tự động còn tập trung vào một luồng tích hợp tổng hợp. |
| Cấu hình, DB và logging | Cấu hình phần lớn theo môi trường; runtime SQLite/PostgreSQL có migration riêng, trong khi codegen Maven vẫn cố định SQLite. |

## Các tài liệu theo chủ đề

1. [Kiến trúc, REST và DTO](01-architecture-rest-dto.md)
2. [CRUD sinh viên, jOOQ và schema](02-student-jooq-database.md)
3. [Validation và xử lý lỗi](03-validation-errors.md)
4. [Authentication, JWT và RBAC](04-auth-jwt-rbac.md)
5. [OpenAPI, Postman và kiểm thử](05-openapi-postman-testing.md)
6. [Cấu hình môi trường, migration và logging](06-configuration-database-logging.md)

## Ghi chú về mức độ

- **Cao (P1):** chặn luồng sử dụng chính hoặc tích hợp ứng dụng trong trường hợp client hiện tại được kỳ vọng dùng backend này.
- **Trung bình (P2):** có thể gây lỗi API, triển khai hoặc vận hành trong tình huống cụ thể.
- **Thấp (P3):** cải thiện độ rõ ràng, tính ổn định hoặc khả năng bảo trì.

Review không khẳng định PostgreSQL đã được chạy kiểm thử với server thật. Kết quả build/test được ghi trong tài liệu kiểm thử tương ứng.
