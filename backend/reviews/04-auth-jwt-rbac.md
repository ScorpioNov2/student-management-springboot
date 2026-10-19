# Kiến thức 4 — Authentication, JWT, refresh-token và RBAC

## Kiến thức

- Authentication xác định danh tính; authorization kiểm tra quyền trên từng thao tác.
- BCrypt là password hash có salt/cost; không lưu hoặc trả password gốc/hash trong response.
- Access token ngắn hạn dùng cho API; refresh token dài hạn cần kiểm soát lưu trữ, hết hạn và rotation/revocation.
- JWT phải kiểm tra chữ ký, thời hạn và mục đích token. Không nên tin role do client gửi; quyền có thể được nạp lại từ nguồn tin cậy.

## Nhận xét từ code

**Điểm tốt**

- [CryptoService.java](../src/main/java/com/example/api/service/domain/auth/CryptoService.java#L15) dùng `PasswordEncoder` BCrypt và giới hạn mật khẩu theo giới hạn 72 byte của BCrypt.
- [TokenProvider.java](../src/main/java/com/example/api/service/domain/auth/TokenProvider.java#L24) yêu cầu secret đủ mạnh; access/refresh có thời hạn và claim phân loại token riêng.
- Refresh token được hash SHA-256 trước khi lưu ở DB; rotation consume token cũ và cấp token mới trong [TokenStorage.java](../src/main/java/com/example/api/service/domain/auth/TokenStorage.java#L21).
- [JwtAuthenticationFilter.java](../src/main/java/com/example/api/security/JwtAuthenticationFilter.java#L49) kiểm tra access-token trước khi lập SecurityContext; roles được nạp từ DB qua [SecurityUserDetailsService.java](../src/main/java/com/example/api/security/SecurityUserDetailsService.java#L21), không lấy role claim làm nguồn phân quyền.
- Các thao tác sinh viên được bảo vệ bằng `@PreAuthorize`; public registration luôn tạo role USER ở repository.

## Findings / khoảng trống

### Trung bình (P2, nếu yêu cầu hỗ trợ logout/revoke) — Chưa có endpoint logout hoặc thu hồi access token

API auth hiện chỉ có register/login/refresh. Refresh token bị thu hồi khi rotate hoặc hết hạn, nhưng người dùng không có endpoint logout để chủ động xóa refresh token hiện tại. Access token đã cấp vẫn hợp lệ đến khi hết hạn. Nếu đề/demo yêu cầu logout hoặc thu hồi tức thì, cần thêm luồng revoke; nếu không, cần ghi rõ giới hạn này trong tài liệu.

### Thấp (P3) — Chưa có test tách riêng cho các nhánh token và authorization

Integration test kiểm tra luồng chính và refresh token cũ bị từ chối, nhưng chưa bao phủ token sai chữ ký, token sai loại, token hết hạn, user bị xóa/role đổi, password sai, username/email trùng và mọi thao tác ADMIN/USER độc lập. Các trường hợp này đặc biệt quan trọng vì filter/security handler chạy ngoài luồng MVC thông thường.

## Đánh giá

Các nguyên tắc nền tảng của password hashing, JWT và RBAC được áp dụng phù hợp cho bài lab. Quyền ADMIN không thể tự cấp qua public registration; SQL thủ công dùng để nâng tài khoản demo cần giới hạn ở môi trường phát triển.
