# Hướng dẫn cài đặt, cấu hình và chạy Backend

Tài liệu này hướng dẫn chạy backend Student Management trên Windows/PowerShell, cấu hình SQLite hoặc PostgreSQL, kiểm tra API, chạy Postman và xử lý các lỗi phổ biến.

> Các lệnh bên dưới giả định repository nằm tại `D:\NAM2\web\lab-web-3`. Nếu lưu ở vị trí khác, thay đường dẫn tương ứng. Không chạy lệnh trong thư mục `frontend`; mọi lệnh Maven cần chạy từ `backend`.

## 1. Yêu cầu cài đặt

- **JDK 21** (cần cho compile/test/run; Maven Wrapper đã có trong repo).
- Git để lấy mã nguồn.
- Postman chỉ cần nếu muốn chạy collection API.
- Nếu dùng PostgreSQL: PostgreSQL Server đang chạy, một database và tài khoản DB có quyền tạo bảng/index trong database đó. Cần có `psql` hoặc pgAdmin để thực hiện các lệnh SQL quản trị.
- Nếu dùng SQLite: không cần cài database server; JDBC driver đã nằm trong Maven dependencies.

Kiểm tra Java và repo:

```powershell
java -version
git --version
Set-Location D:\NAM2\web\lab-web-3\backend
.\mvnw.cmd -version
```

Java phải là phiên bản 21. Nếu lệnh `java` không tồn tại hoặc báo phiên bản khác, cài JDK 21 và cập nhật `JAVA_HOME`/`PATH`, sau đó mở lại PowerShell.

## 2. Chuẩn bị cấu hình môi trường

Mở PowerShell tại thư mục gốc repo và tạo `.env` từ file mẫu:

```powershell
Set-Location D:\NAM2\web\lab-web-3
Copy-Item backend\.env.example backend\.env
```

Tạo secret ngẫu nhiên có độ dài tối thiểu 32 byte và lưu vào `JWT_SECRET` trong `backend\.env`. Có thể sinh secret bằng PowerShell:

```powershell
$bytes = New-Object byte[] 48
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)
$rng.Dispose()
$secret
```

Dán kết quả vào dòng `JWT_SECRET=...` trong `backend\.env`. Không dùng secret ví dụ, không commit `.env`, và không gửi secret/token lên chat hoặc đưa vào Postman collection được chia sẻ.

Ứng dụng đọc biến môi trường của hệ điều hành trước; giá trị trong `.env` chỉ được nạp khi chưa có environment variable hoặc Java system property cùng tên. Vì vậy, nếu `.env` thay đổi nhưng server vẫn dùng giá trị cũ, kiểm tra các biến đã đặt trong PowerShell/Windows.

## 3. Chạy với SQLite (mặc định, khuyến nghị để bắt đầu)

Giữ các giá trị SQLite trong `backend\.env`:

```dotenv
DB_URL=jdbc:sqlite:students.db
DB_DRIVER=org.sqlite.JDBC
DB_USERNAME=
DB_PASSWORD=
JOOQ_SQL_DIALECT=SQLITE
FLYWAY_LOCATIONS=classpath:db/migration
```

Khởi động ứng dụng từ đúng thư mục `backend`:

```powershell
Set-Location D:\NAM2\web\lab-web-3\backend
.\mvnw.cmd spring-boot:run
```

Flyway tự chạy các migration khi Spring khởi động. Với URL mặc định tương đối `jdbc:sqlite:students.db`, database runtime được tạo tại **thư mục hiện hành**, thông thường là:

```text
D:\NAM2\web\lab-web-3\backend\students.db
```

Giữ cửa sổ PowerShell này mở trong khi dùng API. Dừng server bằng `Ctrl+C`.

### Tệp SQLite do Maven codegen tạo

Maven Flyway/jOOQ codegen hiện được cấu hình riêng với URL `jdbc:sqlite:src/main/resources/students.db`. File này phục vụ code generation trong build; nó **không phải** database runtime khi chạy theo lệnh ở trên. Không nhầm hai file, và đừng xóa database runtime nếu còn dữ liệu cần giữ.

Nếu thay đổi SQL migration đã được áp dụng lên một database, Flyway có thể báo checksum mismatch. Không sửa migration cũ để “chữa” lỗi này; tạo migration mới hoặc khôi phục migration nguyên bản. Trước khi đổi/xóa database có dữ liệu, hãy dừng app và sao lưu file DB.

## 4. Chạy với PostgreSQL

### 4.1. Tạo database và user

Ví dụ chạy trong `psql` bằng tài khoản quản trị PostgreSQL (thay password bằng giá trị riêng):

```sql
CREATE ROLE student_app LOGIN PASSWORD 'replace-with-a-strong-password';
CREATE DATABASE student_management OWNER student_app;
```

Đảm bảo PostgreSQL đang nghe tại host/port đã chọn. Ví dụ cấu hình mặc định bên dưới dùng `localhost:5432`.

### 4.2. Chọn cấu hình PostgreSQL

Sửa các biến trong `backend\.env`; thay cấu hình SQLite bằng:

```dotenv
DB_URL=jdbc:postgresql://localhost:5432/student_management
DB_DRIVER=org.postgresql.Driver
DB_USERNAME=student_app
DB_PASSWORD=replace-with-the-same-password
JOOQ_SQL_DIALECT=POSTGRES
FLYWAY_LOCATIONS=classpath:db/migration-postgresql
```

`DB_USERNAME` và `DB_PASSWORD` phải khớp với user được phép kết nối database. Tài khoản cần quyền tạo bảng/index vì Flyway sẽ áp dụng schema.

Khởi động giống SQLite:

```powershell
Set-Location D:\NAM2\web\lab-web-3\backend
.\mvnw.cmd spring-boot:run
```

Flyway tạo schema PostgreSQL từ `db/migration-postgresql`. PostgreSQL runtime được cấu hình trong Spring; plugin codegen trong Maven vẫn trỏ SQLite, vì vậy chạy codegen không phải là kiểm chứng PostgreSQL. Hãy xác minh kết nối PostgreSQL bằng log khởi động/API trên server thực trước khi sử dụng dữ liệu quan trọng.

## 5. Chạy test và build

Từ thư mục `backend`:

```powershell
.\mvnw.cmd test
```

Lệnh này chạy Maven lifecycle, gồm Flyway/jOOQ codegen và integration test với SQLite dùng riêng dưới `backend\target`. Test có thể cần tải dependencies Maven ở lần chạy đầu tiên.

Build artifact:

```powershell
.\mvnw.cmd package
```

Chạy JAR sau khi build:

```powershell
java -jar .\target\api-0.0.1-SNAPSHOT.jar
```

Nhớ tạo `backend\.env` trước khi chạy JAR từ thư mục `backend`, hoặc truyền biến môi trường trực tiếp cho process. Các file `.env` được tìm theo working directory của ứng dụng; không giả định `.env` trong thư mục khác sẽ tự được tìm thấy.

## 6. Xác nhận server và mở tài liệu API

Mặc định server lắng nghe cổng `8080`. Mở một PowerShell khác:

```powershell
Invoke-WebRequest http://localhost:8080/v3/api-docs
```

Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```

OpenAPI JSON:

```text
http://localhost:8080/v3/api-docs
```

Nếu cổng `8080` đang bận, đặt `SERVER_PORT=8081` trong `.env`, khởi động lại, rồi dùng port mới cho URL Swagger/Postman.

## 7. Thử nhanh API

Các URL ví dụ giả định server chạy ở `http://localhost:8080`. Dùng `curl.exe` trong PowerShell để tránh alias `curl`.

### Đăng ký user

```powershell
$body = @{
    username = "demo-user-01"
    email = "demo-user-01@example.test"
    password = "StrongPassword123!"
} | ConvertTo-Json

$registered = Invoke-RestMethod `
    -Method Post `
    -Uri http://localhost:8080/api/auth/register `
    -ContentType "application/json" `
    -Body $body

$registered
```

Đăng ký công khai luôn tạo role `USER`. Response có `accessToken`, `refreshToken` và `user`.

### Đọc danh sách/tìm kiếm sinh viên

```powershell
$token = $registered.accessToken
Invoke-RestMethod `
    -Method Get `
    -Uri "http://localhost:8080/api/students?search=Ivan&page=0&size=10&sortBy=fullName&sortDirection=asc" `
    -Headers @{ Authorization = "Bearer $token" }
```

Query parameters hỗ trợ `search`, `fullName`, `groupName`, `isuId`, `dormitoryNumber`, `foreigner`, `page`, `size`, `sortBy`, `sortDirection`. `page` bắt đầu từ 0; `size` nằm trong khoảng 1–100.

Các thao tác đọc yêu cầu Bearer access token. USER được đọc nhưng không được POST/PATCH/DELETE.

### Đăng nhập

```powershell
$loginBody = @{
    username = "demo-user-01"
    password = "StrongPassword123!"
} | ConvertTo-Json

$login = Invoke-RestMethod `
    -Method Post `
    -Uri http://localhost:8080/api/auth/login `
    -ContentType "application/json" `
    -Body $loginBody
```

Trường `username` nhận username hoặc email.

### Refresh token

```powershell
$refreshBody = @{ refreshToken = $login.refreshToken } | ConvertTo-Json
Invoke-RestMethod `
    -Method Post `
    -Uri http://localhost:8080/api/auth/refresh `
    -ContentType "application/json" `
    -Body $refreshBody
```

Refresh token được rotate; dùng token mới từ response cho lần refresh kế tiếp. Token cũ sau khi đã dùng sẽ bị từ chối.

## 8. Chạy Postman collection và thử quyền ADMIN

Import file:

```text
backend/postman/Student-Management.postman_collection.json
```

Trong Postman:

1. Chọn collection `Student Management API`; sửa `baseUrl` nếu app không dùng cổng 8080.
2. Chạy `Authentication > Register USER`. Pre-request script tạo username/email duy nhất; test script lưu access/refresh token vào collection variables.
3. Chạy `Login USER` và `Refresh USER tokens` để thử login và token rotation.
4. Chạy `Register ADMIN account (starts as USER)`. Endpoint này vẫn tạo USER. Lấy `adminUsername` từ collection variables.
5. Gán role ADMIN trong DB demo bằng công cụ SQLite/PostgreSQL tương ứng:

   ```sql
   UPDATE users SET role = 'ADMIN' WHERE username = '<adminUsername>';
   ```

   Với SQLite, file runtime mặc định là `backend\students.db` nếu chạy app từ thư mục backend. Có thể mở file bằng DB Browser for SQLite. Với PostgreSQL, kết nối đúng database đã cấu hình và chạy SQL qua `psql`/pgAdmin.

6. Chạy `Login ADMIN`; test script lưu token ADMIN.
7. Chạy `Students - ADMIN > Create student`. Request lưu `studentId`.
8. Chạy các request GET/PATCH/DELETE trong folder ADMIN. Chạy GET bằng token USER để xác nhận read-only; POST/PATCH/DELETE bằng USER dự kiến trả HTTP 403.

Nếu collection được import lại hoặc dùng environment variables cùng tên, chọn đúng collection variable scope. Nếu ISU ID mẫu `654321` đã tồn tại, đổi `uniqueIsuId` trước khi tạo student.

## 9. API, quyền và mã trạng thái

| Method | Endpoint | Quyền | Ý nghĩa |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Tạo tài khoản USER |
| POST | `/api/auth/login` | Public | Đăng nhập |
| POST | `/api/auth/refresh` | Public, cần refresh token hợp lệ trong body | Rotate token |
| GET | `/api/students` | USER/ADMIN | List, search, filter, sort, pagination |
| GET | `/api/students/{id}` | USER/ADMIN | Lấy chi tiết |
| POST | `/api/students` | ADMIN | Tạo sinh viên |
| PATCH | `/api/students/{id}` | ADMIN | Cập nhật một phần |
| DELETE | `/api/students/{id}` | ADMIN | Xóa sinh viên |

Không có HTTP method chuẩn tên `QUERY`; truy vấn danh sách dùng GET và query string. Sinh viên có ISU ID dương/duy nhất; tên không được chứa chữ số; số ký túc xá phải dương. Thành công khi tạo trả 201, xóa trả 204; dữ liệu sai thường trả 400, chưa xác thực 401, thiếu quyền 403, không tìm thấy sinh viên 404 và duplicate ISU ID 409. Error body dùng schema chung có `timestamp`, `status`, `error`, `message`, `path`, `validationErrors`.

## 10. Cấu hình hiện hỗ trợ

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `SERVER_PORT` | `8080` | Cổng HTTP |
| `DB_URL` | `jdbc:sqlite:students.db` | JDBC URL |
| `DB_DRIVER` | `org.sqlite.JDBC` | JDBC driver |
| `DB_USERNAME` | rỗng | User DB, cần cho PostgreSQL |
| `DB_PASSWORD` | rỗng | Password DB, cần cho PostgreSQL |
| `JOOQ_SQL_DIALECT` | `SQLITE` | Dialect runtime của jOOQ |
| `FLYWAY_LOCATIONS` | `classpath:db/migration` | Migration location |
| `JWT_SECRET` | bắt buộc | HMAC signing secret tối thiểu 32 byte |
| `JWT_ACCESS_EXPIRATION_MS` | `900000` | Access token: 15 phút |
| `JWT_REFRESH_EXPIRATION_MS` | `604800000` | Refresh token: 7 ngày |
| `LOGGING_LEVEL_JOOQ` | `INFO` | Mức log cho jOOQ listener |

## 11. Xử lý lỗi thường gặp

### `JWT_SECRET` chưa được đặt hoặc secret quá ngắn

- Xác nhận `backend\.env` tồn tại và có `JWT_SECRET=...`.
- Đảm bảo secret có tối thiểu 32 byte UTF-8; secret sinh bằng script ở mục 2 đáp ứng yêu cầu.
- Xác nhận server được khởi chạy với current directory là `backend`.
- Kiểm tra biến môi trường Windows có đang ghi đè giá trị `.env` hay không.

### Port đang được sử dụng

Đặt `SERVER_PORT` sang một cổng khác, ví dụ `8081`, restart và cập nhật URL client.

### PostgreSQL connection refused / authentication failed

- Xác nhận PostgreSQL service đang chạy và port/host trong `DB_URL` đúng.
- Kiểm tra database đã được tạo, user/password đúng, user có quyền kết nối và quyền tạo schema object.
- Đảm bảo cả năm biến DB PostgreSQL được cấu hình đúng: URL, driver, username, password, jOOQ dialect; đồng thời Flyway location trỏ `db/migration-postgresql`.

### Flyway báo checksum mismatch

Không sửa/xóa trực tiếp `flyway_schema_history` hoặc migration đã chạy để bỏ qua lỗi. Khôi phục file migration nguyên bản nếu bị chỉnh sửa; nếu cần thay schema, thêm migration version mới. Chỉ dùng repair/đổi DB sau khi hiểu rõ tác động và đã backup.

### Flyway không tạo unique index ISU ID (migration V2 thất bại)

DB cũ có thể đã có ISU ID trùng. Trước khi migration, tìm và xử lý duplicate trong dữ liệu, sao lưu DB và chạy migration lại. Không bỏ unique index nếu nghiệp vụ yêu cầu ISU ID duy nhất.

### API trả 401/403

- 401: đăng nhập lại hoặc refresh để lấy access token mới; gửi header `Authorization: Bearer <accessToken>`, không gửi refresh token ở header API sinh viên.
- 403: token hợp lệ nhưng role chưa có quyền; USER chỉ được đọc. Kiểm tra role tài khoản ADMIN trong DB và đăng nhập lại để JWT mới được phát hành.

### Postman gọi sai URL hoặc frontend không kết nối

Postman collection mặc định dùng `http://localhost:8080`. Frontend hiện tại vẫn chứa URL Django `http://127.0.0.1:8000` và hợp đồng snake_case/Django; tài liệu này không đồng nghĩa frontend đã được nối với API Java.

### Test/build thất bại khi tải Maven dependencies

Kiểm tra kết nối Maven Central/proxy, rồi thử lại:

```powershell
Set-Location D:\NAM2\web\lab-web-3\backend
.\mvnw.cmd -U test
```

Nếu lỗi báo thiếu JDK/compiler, kiểm tra lại `java -version` và `JAVA_HOME`.
