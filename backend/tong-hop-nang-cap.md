# Tổng hợp nâng cấp hệ thống Mua hàng SGI

## I. Chức năng mới đã hoàn thành (30 commit gần nhất)

### 1. Import Excel đơn hàng (nâng cấp lớn)
- Tự động sinh poCode (`IMP-YYYYMMDD-NNN`)
- Map 18+ cột mới: ngày thanh toán, phí order, VC nội địa/quốc tế, tỷ giá, phương thức TT, nguồn nhập, ghi chú...
- Tự động tạo sản phẩm vào danh sách giá vốn khi import
- Lookup posCode từ productName
- Detect header động (dòng 1 hoặc 2), xử lý ô FORMULA/ngày tháng
- Mặc định: status `COMPLETED`, reloadreloadpaymentStatus `PAID`, createdBy `unkown`, spec `pcs`

### 2. Quản lý người dùng & phân quyền (RBAC)
- 9 vai trò: ADMIN, CEO, WAREHOUSE, ACCOUNTANT, CHIEF_ACCOUNTANT, SALES, SALES_MANAGER, MANAGER, USER, PENDING
- CRUD người dùng (UserList, UserForm, UserDetail)
- Phân quyền chi tiết theo module (Read/Create/Update/Delete/Submit/Approve/Reject/Pay/Confirm)
- Thêm trường department cho user
- Menu điều hướng theo vai trò

### 3. Danh mục sản phẩm (nâng cấp)
- Quy tắc tạo mã SP mới: `PKD (3 ký tự) - Tên SP (4 chữ đầu) - XXX (số tăng dần)`
- Thêm cột SKU, phòng kinh doanh (department filter)
- Đổi tên Mã POS → Mã sản phẩm (POS)
- Validate trùng tên sản phẩm
- Nút xóa toàn bộ sản phẩm
- Tự động generate code khi sửa SP, zero-pad sequence 3 số

### 4. Yêu cầu thanh toán (DNTT)
- Liên kết nhiều PO và nhiều vận đơn trong 1 DNTT
- Ma trận phí tùy chỉnh (custom fees matrix)
- Quy trình duyệt: L1 → L2 → Kế toán kiểm tra → Chi trả
- Upload file đính kèm (chứng từ thanh toán)
- Chênh lệch tỷ giá
- Thêm department + initiatorDepartment vào danh sách

### 5. Dashboard & Thống kê
- KPIs theo vai trò
- Biểu đồ xu hướng (đơn hàng/kế hoạch/thanh toán theo tháng)
- Biểu đồ tròn phân tích nguồn, biểu đồ cột top sản phẩm
- Danh sách đơn hàng gần đây (Recharts)

### 6. Tính năng khác
- Quản lý tài khoản ngân hàng (CRUD + upload QR)
- Quản lý tuyến đường vận chuyển (Trade Routes)
- Quản lý tỷ giá ngoại tệ (ExchangeRateConfig)
- Phiếu nhập kho (Warehouse Receipt) với giá vốn bình quân
- Quản lý vận đơn (Waybill) + theo dõi lô hàng
- Theo dõi giá vốn (Product Cost) + cảnh báo biến động >20%
- Chi phí & nhận xét (Cost Comments) gắn với PO
- Thông báo (Notifications) - chuông + auto refresh 15s
- Tìm kiếm toàn cục (Global Search)
- Docker Compose + Deploy script + Caddyfile reverse proxy
- 44 Flyway migrations, 19 file test (JUnit 5 + Mockito)

---

## II. Vấn đề đã fix (gần nhất)

| Commit | Vấn đề |
|--------|--------|
| `802cca0` | Header Excel có newline/nội dung trong ngoặc |
| `ce49495` | Thu nhỏ select bộ lọc phòng ban width 90px |
| `ea3bc29` | Bỏ minWidth select bộ lọc phòng ban |
| `efb6d61` | Thu nhỏ select bộ lọc phòng ban bằng nút làm mới |
| `5bb9628` | saveAndFlush khi regenerate codes tránh trùng sequence |
| `e916f5e` | Lấy chữ cái đầu mỗi từ cho 4 ký tự tên SP (C-JESUS CAR → CJCH) |
| `6f10b26` | Lọc ký tự đặc biệt khi lấy 4 ký tự đầu tên SP |
| `8f6012e` | Auto-generate code khi sửa SP, fix table layout tràn chữ |
| `1e8fa83` | Detect header row động, hỗ trợ Excel header ở dòng 1 |
| `4a6d4d6` | Xử lý ô FORMULA trong Excel |
| `b4d8e97` | Dùng DateUtil để detect ô dạng ngày tháng |

---

## III. Vấn đề tồn đọng cần xử lý

| # | Vấn đề | Mô tả |
|---|--------|-------|
| 1 | Form thông tin NH bị `[Object Object]` | Trường thông tin ngân hàng trong form tạo DNTT hiển thị sai |
| 2 | Nút tạo đơn hiển thị cho mọi role | Chỉ nên hiển thị với role có thẩm quyền |
| 3 | Dashboard thiếu biến thể | Cột mã đơn, mã POS, số lượng chưa hiển thị biến thể tốt |
| 4 | Search nâng cao chưa hoàn thiện | Cần search đa thực thể (PO, DNTT, Waybill) |
| 5 | Bỏ link đăng ký & chữ Demo ở trang login | Chưa thực hiện |
| 6 | Hiển thị quy trình mua hàng | Chia 2 màn: sơ đồ tổng thể + quy trình theo vai trò user |
| 7 | Đơn giá - Thành tiền - Quy đổi VND | Cần thống nhất theo mẫu phiếu mua hàng (nhân dân tệ) |
| 8 | Cột "Ngày về thực tế", "Người check", "SL kho nhận" | Chưa map trong import Excel |

---

## IV. Tính năng dự kiến đợt sau

| Ưu tiên | Tính năng | Mô tả |
|---------|-----------|-------|
| 🔴 Cao | **Audit Log** | Ghi lại tất cả thay đổi dữ liệu (ai, cái gì, khi nào) |
| 🔴 Cao | **Email Notifications** | Gửi email thông báo khi cần duyệt (SMTP + template) |
| 🟡 TB | **Export Excel** | Xuất dữ liệu ra Excel cho PO, DNTT, sản phẩm, kho |
| 🟡 TB | **Báo cáo PDF** | Tạo PDF cho đơn hàng, phiếu thanh toán, phiếu nhập kho |
| 🟡 TB | **Swagger / OpenAPI** | Tự động tạo tài liệu API |
| 🟡 TB | **Quản lý kho nâng cao** | Nhập/xuất/tồn, cảnh báo tồn tối thiểu |
| 🟡 TB | **Lọc & tìm kiếm nâng cao** | Nhiều tiêu chí lọc hơn |
| 🟢 Thấp | **Cổng thanh toán** | Tích hợp thanh toán trực tuyến |
| 🟢 Thấp | **Đa ngôn ngữ (i18n)** | Hỗ trợ Anh, Việt, Trung... |
| 🟢 Thấp | **Mobile App (React Native)** | Ứng dụng di động |
| 🟢 Thấp | **Tích hợp phần mềm kế toán** | Kết nối với hệ thống kế toán hiện có |

---

*Cập nhật lần cuối: 23/06/2026*
*Tổng số commit: 32+ | Controllers: 15 | Services: 17 | Entities: 22 | Migrations: 44*

## 🔄 Cập nhật mới nhất (23/06/2026)

### Phân quyền
- ✅ Sửa quyền update trạng thái vận đơn: chỉ ADMIN và PURCHASING có quyền sửa (PATCH /v1/waybills/{id}/status)

### UI/UX Cải tiến
- ✅ **WaybillNew:** Cột "Tổng cước" có thể sửa tay, đổi vị trí cột Tỷ giá/Đơn giá VC/Tổng cước lên trước KL/T.tích
- ✅ **PaymentRequestNew:** Cột "Thành tiền" có thể sửa tay
- ✅ Tính toán tự động dùng giá trị manual nếu có, ngược lại dùng công thức
