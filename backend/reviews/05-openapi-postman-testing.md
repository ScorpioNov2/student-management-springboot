# Kiến thức 5 — Tài liệu API, Postman và kiểm thử

## Kiến thức

- OpenAPI mô tả endpoint, query/body schema, auth, status và response; Swagger UI là cách duyệt tài liệu đó.
- Collection Postman nên chạy được theo thứ tự, lưu token/ID bằng biến và chứng minh cả thành công lẫn bị từ chối theo role.
- Integration tests nên kiểm tra hợp đồng HTTP qua controller, security filter, validation, service, repository và DB; unit tests bổ sung các nhánh nghiệp vụ nhỏ.

## Nhận xét từ code

**Điểm tốt**

- [OpenApiConfig.java](../src/main/java/com/example/api/config/OpenApiConfig.java#L11) cấu hình bearer JWT; controller có operation summary và tag.
- [Student-Management.postman_collection.json](../postman/Student-Management.postman_collection.json) bao gồm đăng ký/login/refresh, GET tìm kiếm, CRUD ADMIN và các thao tác bị USER từ chối.
- Collection dùng biến cho token/student ID và test scripts kiểm tra response status.
- [ApiIntegrationTests.java](../src/test/java/com/example/api/ApiIntegrationTests.java#L47) kiểm tra end-to-end với SQLite, gồm register, refresh rotation, RBAC, CRUD, duplicate ISU ID và validation tên.

## Findings

### Trung bình (P2) — OpenAPI mô tả endpoint/status chưa đầy đủ

[StudentController.java](../src/main/java/com/example/api/controller/StudentController.java#L42) có operation summary, nhưng các operation chưa khai báo rõ response schemas/status cho 400/401/403/404/409; các DTO cũng chưa có mô tả trường/format nghiệp vụ. Swagger vẫn tạo spec cơ bản, nhưng client/giảng viên khó hiểu đầy đủ contract chỉ từ tài liệu. Nên thêm `@ApiResponse`/schema examples hoặc mô tả equivalent.

### Trung bình (P2) — Test coverage tập trung vào một integration scenario lớn

Hiện có một test tổng hợp duy nhất [registrationRefreshAndRoleProtectedStudentCrud](../src/test/java/com/example/api/ApiIntegrationTests.java#L47). Test này rất hữu ích cho luồng chính, nhưng khi fail khó cô lập nguyên nhân và không bao phủ độc lập nhiều status/error path như sort/page invalid, GET unknown ID, malformed/expired JWT, registration validation, login sai mật khẩu và role matrix đủ các method. Nên tách test theo use case và bổ sung các nhánh còn thiếu.

### Thấp (P3) — Tạo ADMIN trong collection cần bước SQL thủ công

Đây là lựa chọn an toàn vì API public không cho tự cấp ADMIN. Tuy nhiên, Postman collection không thể tự chạy bước nâng role; cần thực hiện SQL thủ công theo hướng dẫn README trước `Login ADMIN`. Hướng dẫn hiện tại đủ cho demo nhưng cần lưu ý đây không phải luồng quản trị production.

## Đánh giá

Yêu cầu có OpenAPI và Postman collection đã được đáp ứng ở mức chức năng. Phần cần nâng cấp là độ chi tiết của spec và độ phân nhánh của automated tests; test hiện có đã chứng minh các luồng chính nhưng không thay thế được coverage cho lỗi biên.
