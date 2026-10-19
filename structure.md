<pre>
# # # # # # # # # #
#        VI       #
# # # # # # # # # #
student-management-system/                                  # Thư mục gốc của dự án (Root)
├── .env.example                                            # File mẫu định nghĩa các biến môi trường (DB, JWT...)
├── .gitignore                                              # Khai báo bỏ qua các file môi trường thật (.env) và thư mục target/
├── pom.xml                                                 # File cấu hình Maven: Quản lý toàn bộ thư viện & Plugin jOOQ Codegen
│
└── src/
    ├── main/
    │   ├── java/com/example/studentmanagement/
    │   │   ├── config/                                     # Cấu hình Spring Boot nền tảng
    │   │   │   ├── SecurityConfig.java                     # Cấu hình Spring Security, bộ lọc JWT và phân quyền
    │   │   │   ├── JooqConfig.java                         # Cấu hình DSLContext kết nối DB và Quản lý Transaction
    │   │   │   └── OpenApiConfig.java                      # Cấu hình Swagger UI tự động tạo tài liệu API công khai
    │   │   │
    │   │   ├── controller/                                 # TẦNG ĐIỀU HƯỚNG & PHÂN QUYỀN (Không chứa bất kỳ logic nào)
    │   │   │   ├── AuthController.java                     # Tiếp nhận điều hướng Đăng ký, Đăng nhập, Refresh Token
    │   │   │   └── StudentController.java                  # Tiếp nhận điều hướng CRUD Sinh viên, Tìm kiếm, Phân trang
    │   │   │
    │   │   ├── dto/                                        # Hệ thống Data Transfer Object (Tách biệt API với Database)
    │   │   │   ├── request/                                # Nhận dữ liệu từ Client (LoginRequest, StudentPatchDTO...)
    │   │   │   └── response/                               # Xuất dữ liệu trả về Client (AuthResponse, PagedResponse<T>...)
    │   │   │
    │   │   ├── exception/                                  # Tầng quản lý lỗi tập trung của ứng dụng
    │   │   │   ├── GlobalExceptionHandler.java             # Gom tất cả các lỗi hệ thống về một định dạng JSON chuẩn
    │   │   │   └── CustomException.java
    │   │   │
    │   │   ├── security/                                   # Hạ tầng bảo mật tích hợp vào Spring Security Filter Chain
    │   │   │   ├── JwtAuthenticationFilter.java            # Bộ lọc chặn HTTP Request để bóc tách và xác thực JWT
    │   │   │   └── SecurityUserDetailsService.java         # Nạp thông tin tài khoản để đối chiếu thông tin đăng nhập
    │   │   │
    │   │   ├── service/                                    # TẦNG DỊCH VỤ (BUSINESS LOGIC)
    │   │   │   │
    │   │   │   /* 1. Đầu Mối Điều Phối Chính (Facade Services) - Nhạc trưởng của hệ thống */
    │   │   │   ├── AuthService.java
    │   │   │   ├── StudentService.java
    │   │   │   │
    │   │   │   /* 2. Các Domain Component Độc Lập - Nắm giữ Sub-services nghiệp vụ và Repository nội bộ */
    │   │   │   └── domain/         
    │   │   │       ├── student/                            # HỢP NHẤT MODULE SINH VIÊN
    │   │   │       │   ├── StudentQueryService.java        # Chuyên truy vấn: Tìm kiếm, Lọc và tính toán Phân trang
    │   │   │       │   ├── StudentCommandService.java      # Chuyên sửa đổi: Tạo mới, Xóa và Cập nhật một phần (PATCH)
    │   │   │       │   ├── StudentValidator.java           # Chuyên kiểm tra ràng buộc logic của sinh viên (Trùng số, trùng email)
    │   │   │       │   └── StudentRepository.java          # [Đã Dịch Chuyển] - NON-PUBLIC: Chỉ nội bộ gói student được gọi
    │   │   │       │
    │   │   │       ├── auth/                               # HỢP NHẤT MODULE XÁC THỰC HẠ TẦNG
    │   │   │       │   ├── CryptoService.java              # Chuyên mã hóa, băm mật khẩu (BCrypt) và kiểm tra tính hợp lệ
    │   │   │       │   ├── TokenProvider.java              # Chuyên sinh chuỗi ký số JWT (Access/Refresh Token) và giải mã
    │   │   │       │   ├── TokenStorage.java               # Chuyên xử lý logic lưu trữ chuỗi Refresh Token
    │   │   │       │   └── TokenRepository.java            # [Đã Dịch Chuyển] - NON-PUBLIC: Chỉ nội bộ gói auth được gọi
    │   │   │       │
    │   │   │       └── user/                               # HỢP NHẤT MODULE NGƯỜI DÙNG
    │   │   │           ├── UserQueryService.java           # Chuyên tìm kiếm, kiểm tra sự tồn tại của Tài khoản
    │   │   │           ├── UserCommandService.java         # Chuyên ghi mới thông tin người dùng vào hệ thống
    │   │   │           └── UserRepository.java             # [Đã Dịch Chuyển] - NON-PUBLIC: Chỉ nội bộ gói user được gọi
    │   │   │
    │   │   └── <del>repository/</del>                      # [ĐÃ CHUYỂN ĐI] - TẦNG TRUY VẤN jOOQ GỐC ĐỘC LẬP (Mỗi bảng một Repository)
    │   │       ├── <del>StudentRepository.java</del>       # [Đã dời vào domain/student/] - Nạp DSLContext để xây dựng SQL động (Count, Limit, Offset)
    │   │       ├── <del>UserRepository.java</del>          # [Đã dời vào domain/user/] - Nạp DSLContext để truy vấn trực tiếp bảng Users
    │   │       └── <del>TokenRepository.java</del>         # [Đã dời vào domain/auth/] - Nạp DSLContext để truy vấn trực tiếp bảng Refresh Token
    │   │
    │   └── resources/                                      # Thư mục chứa tài nguyên tĩnh và cấu hình môi trường bên trong
    │       ├── application.yml                             # File cấu hình Spring: Ánh xạ động các biến từ file `.env` vào hệ thống
    │       └── db/migration/                               # Thư mục chứa các file .sql khởi tạo cấu trúc bảng cho DB có sẵn
    │           └── V1__init_schema.sql                     # File SQL tạo bảng users, students, refresh_tokens để jOOQ quét sinh mã
    │
    └── test/                                               # Thư mục cô lập mã nguồn phục vụ viết Unit Test độc lập cho từng Sub-service
</pre>