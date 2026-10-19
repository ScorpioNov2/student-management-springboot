# Kiến thức 6 — Cấu hình môi trường, migration, DB và logging

## Kiến thức

- Secret/URL/driver/dialect là cấu hình môi trường, không hard-code vào logic nghiệp vụ.
- Flyway migration phải chạy trước khi repository truy cập schema; nhiều DB cần migration/location/schema tương ứng và được kiểm thử trên engine thực.
- Logging cần đủ để điều tra lỗi nhưng không ghi credential, password, token hoặc dữ liệu cá nhân nhạy cảm.
- Codegen DB và runtime DB cần cùng schema/dialect hoặc cần quy trình chủ động giữ chúng đồng bộ.

## Nhận xét từ code

**Điểm tốt**

- [application.yml](../src/main/resources/application.yml#L8) lấy DB URL/driver/dialect từ môi trường và JWT secret không có fallback mặc định.
- [backend/.env.example](../.env.example#L1) liệt kê biến cấu hình; README hướng dẫn SQLite và PostgreSQL.
- Flyway runtime được nối vào startup trong [FlywayConfig.java](../src/main/java/com/example/api/config/FlywayConfig.java#L11); repositories khai báo phụ thuộc migration.
- Schema PostgreSQL có migration riêng; `.env` loader không ghi đè environment variables hoặc system properties.
- [GlobalExceptionHandler.java](../src/main/java/com/example/api/exception/GlobalExceptionHandler.java#L56) log exception không dự kiến; có cấu hình log jOOQ theo biến môi trường.

## Findings / lưu ý vận hành

### Trung bình (P2) — PostgreSQL runtime chưa được xác nhận bằng integration test

Test hiện chạy SQLite; [ApiIntegrationTests.java](../src/test/java/com/example/api/ApiIntegrationTests.java#L22) cấu hình URL SQLite rõ ràng. PostgreSQL có migration riêng, nhưng không có test profile/container chứng minh migration, kiểu dữ liệu, `RETURNING`, timestamp và jOOQ query đều chạy trên server PostgreSQL. Cần chạy integration test với PostgreSQL trước khi coi cấu hình đó đã được xác nhận.

### Thấp (P3) — Codegen Maven vẫn cố định vào SQLite

Phần Flyway Maven plugin và jOOQ codegen trong [pom.xml](../pom.xml#L142) trỏ tới `src/main/resources/students.db` và `org.sqlite.JDBC`, kể cả khi runtime cấu hình PostgreSQL. Hiện code repository dùng DSL động nên không phụ thuộc trực tiếp class codegen; tuy nhiên, nếu dùng codegen làm schema source thì generated schema có thể khác runtime PostgreSQL. Nên ghi rõ codegen chỉ phục vụ SQLite hoặc đưa codegen theo profile/dialect.

### Thấp (P3) — Logging truy vấn jOOQ cần được kiểm tra trước môi trường có dữ liệu thật

Mức `INFO` cho `org.jooq.tools.LoggerListener` được cấu hình tại [application.yml](../src/main/resources/application.yml#L20). Cần xác nhận phiên bản jOOQ đang dùng ghi gì ở mức INFO, nhất là SQL/bind values, trước khi bật với production data. Không log token, password, refresh token hay thông tin sinh viên không cần thiết.

### Trung bình (P2, áp dụng khi nâng cấp DB có dữ liệu) — Migration V2 có thể thất bại do ISU ID duplicate

Unique index V2 giúp đảm bảo dữ liệu mới, nhưng trước khi deploy lên SQLite/PostgreSQL đã có dữ liệu cần chạy truy vấn rà duplicate và backup. Chi tiết ở [review CRUD/jOOQ](02-student-jooq-database.md).

## Đánh giá

Cấu hình nhạy cảm đã được đưa ra môi trường và SQLite runtime có migration/test. Phần PostgreSQL và quy trình nâng cấp dữ liệu cũ vẫn cần xác thực riêng; build thành công với SQLite không chứng minh cả hai database chạy tương đương.
