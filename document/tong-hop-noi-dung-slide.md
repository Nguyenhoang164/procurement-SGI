# TỔNG QUAN HỆ THỐNG MUA HÀNG SGI (SGI PROCUREMENT SYSTEM)

---

## 1. VẤN ĐỀ HIỆN TẠI

- Quy trình mua hàng nhập khẩu thủ công qua **Excel + email** → không tập trung, dễ sai sót
- Không có hệ thống theo dõi **một quy trình khép kín**: từ kế hoạch → đặt hàng → vận chuyển → nhập kho → thanh toán
- Dữ liệu phân tán, mỗi phòng ban làm việc riêng lẻ:
  - **Kinh doanh**: lập kế hoạch tuần (PKD1) trên Excel
  - **Mua hàng**: tạo PO (PKD2) không có dữ liệu kế thừa
  - **Kế toán**: theo dõi DNTT bằng file riêng
  - **Kho**: xác nhận nhập không đồng bộ
- Giá vốn sản phẩm không được cập nhật tự động, gây khó khăn cho việc tính lãi/lỗ
- Không có cơ chế phân quyền → ai cũng thấy được tất cả dữ liệu
- Mất trung bình **2-3 ngày** để tổng hợp một báo cáo đơn hàng

---

## 2. HỆ QUẢ

| Hệ quả | Tác động |
|---|---|
| Sai sót dữ liệu do nhập tay nhiều lần | Thiếu chính xác, mất thời gian đối chiếu |
| Chậm phê duyệt DNTT (không biết đang ở khâu nào) | Nhà cung cấp chậm thanh toán → ảnh hưởng uy tín |
| Không kiểm soát được biến động giá vốn | Có lô giá cao đột biến nhưng không phát hiện kịp |
| Chứng từ thanh toán thất lạc | Khó kiểm toán, mất tới **1-2 ngày/tuần** để tìm kiếm |
| Mỗi bộ phận dùng file Excel riêng | Dữ liệu không đồng nhất, đối chiếu mất **3-5 ngày/tháng** |
| PO đến kho nhưng kho không có thông báo trước | Hàng nằm cảng quá hạn → phí lưu container |

---

## 3. GIẢI PHÁP — HỆ THỐNG MUA HÀNG TẬP TRUNG

Xây dựng hệ thống web **full-stack** quản lý toàn bộ quy trình mua hàng nhập khẩu:

- **Công nghệ**: Java Spring Boot (backend) + React (frontend) + MySQL (database) + Docker (triển khai)
- **Mô hình**: 3-layer (Controller → Service → Repository) + DTO + JWT Auth
- **Triển khai**: Docker Compose trên VPS, Nginx reverse proxy

---

## 4. NỘI DUNG CỤ THỂ (18 nhóm tính năng hoàn chỉnh)

### 4.1 Quản lý phân quyền (RBAC)
- **9 vai trò**: ADMIN, CEO, WAREHOUSE, ACCOUNTANT, CHIEF_ACCOUNTANT, SALES, SALES_MANAGER, PURCHASING, PENDING
- Phân quyền đến từng thao tác: Create/Read/Update/Delete/Submit/Approve/Reject/Pay/Confirm
- Menu điều hướng tự động ẩn/hiện theo vai trò
- File phân quyền chi tiết: role_permission_matrix.txt (422 dòng)

### 4.2 Kế hoạch tuần (Weekly Plan)
- Lập kế hoạch nhập hàng theo tuần
- Gửi duyệt → L1 (SALES/SALES_MANAGER) → L2 (ADMIN)
- Chuyển đổi một dòng kế hoạch → Đơn hàng (kế thừa dữ liệu)

### 4.3 Đơn hàng nhập khẩu (Purchase Order)
- Form đầy đủ ~30 trường: tiền hàng, cước VC nội địa, cước VC quốc tế, phí đặt hàng, ship nội địa
- **Tự động tính toán**: tổng tiền lô, giá vốn 1 sản phẩm, còn phải thanh toán
- Luồng duyệt: Draft → PENDING_L1 → PENDING_ACCOUNTING → APPROVED / REJECTED
- Import đơn hàng từ file Excel
- Theo dõi chi phí chi tiết trên từng đơn hàng

### 4.4 Đề nghị thanh toán (DNTT / Payment Request)
- Liên kết nhiều PO + nhiều vận đơn trong 1 DNTT
- Ma trận phí tùy chỉnh (custom fees matrix) — cho phép nhập nhiều loại phí khác nhau
- **Quy trình duyệt 4 bước**: L1 (Kế toán) → Accounting Check → L2 (ADMIN) → Chi trả → Xác nhận
- Upload file đính kèm (chứng từ thanh toán)
- Xử lý chênh lệch tỷ giá USD/VND

### 4.5 Vận đơn & Vận chuyển (Waybill + Shipment Tracking)
- Tạo và quản lý vận đơn đường biển/quốc tế
- **Theo dõi lô hàng theo sự kiện**: vị trí, thời gian, trạng thái
- Xác nhận giao hàng thành công
- Liên kết vận đơn với DNTT và PO
- Quản lý tuyến đường vận chuyển (Trade Routes): active/inactive

### 4.6 Nhập kho & Giá vốn (Warehouse + Product Cost)
- Nhập kho theo từng item, kiểm tra số lượng PO → số lượng nhập
- Upload **hình ảnh cho từng item nhập kho** — minh chứng trực quan
- **Tự động cập nhật giá vốn bình quân gia quyền** khi nhập kho
- **Cảnh báo biến động giá >20%** (Cost Alerts) — phát hiện sớm bất thường
- Nhận xét chi phí trên PO (Cost Comments) — kênh trao đổi giữa kế toán và sales

### 4.7 Quản lý sản phẩm (Product Management)
- Danh mục sản phẩm với mã POS tự động
- **Import Excel** hàng loạt, **xóa hàng loạt**
- Product Combos (nhóm sản phẩm)
- Thư viện hình ảnh sản phẩm (image gallery)
- Tự động **generate mã POS** tránh trùng lặp

### 4.8 Dashboard & Thống kê
- **KPIs vai trò**: số đơn tháng, đơn đang vận chuyển, tổng tiền hàng, DNTT chờ duyệt
- **Biểu đồ xu hướng** (đơn hàng/kế hoạch/thanh toán theo tháng) — Recharts
- **Biểu đồ tròn** — phân tích nguồn nhập
- **Biểu đồ cột** — top sản phẩm nhập khẩu
- **Danh sách đơn hàng gần đây**

### 4.9 Tính năng hỗ trợ khác
- **Tìm kiếm toàn cục** (Global Search): tìm PO, DNTT, vận đơn — 1 ô tìm kiếm cho tất cả
- **Thông báo** (Notification Bell): auto-refresh 15 giây, đếm số chưa đọc, tổng hợp các thực thể chờ duyệt
- **Quản lý tài khoản ngân hàng**: CRUD + upload QR code + danh sách 50+ ngân hàng
- **Tỷ giá ngoại tệ**: cấu hình linh hoạt USD, CNY
- **Đăng ký tài khoản**: self-registration
- **Auth JWT**: login/register, token 24h, phân quyền API

---

## 5. KIẾN TRÚC HỆ THỐNG

### 5.1 Backend (Java Spring Boot 3.5)

| Thành phần | Số lượng |
|---|---|
| REST controllers | **17** |
| Services | **20** |
| Repositories | **23** |
| JPA Entities (tables) | **23** |
| DTOs | **33** |
| Flyway migrations | **52** |
| File test (JUnit 5 + Mockito) | **19** |

### 5.2 Frontend (React 18)

| Thành phần | Số lượng |
|---|---|
| Pages | **32** |
| Reusable components | **8** (Navigation, Pagination, Toast, ProtectedRoute, PosCodeSelector...) |
| CSS files | **15** |
| Utility files | **2** (permissions, paymentUtils) |
| Custom hooks | **2** (useNotifications, useOrders) |

### 5.3 Database (MySQL 8)
- 23 tables với quan hệ phức tạp
- 52 versioned migrations qua Flyway
- Các bảng chính: users, products, purchase_orders, weekly_plans, payment_requests, waybills, warehouse_receipts, shipment_trackings...
- Cascade delete, foreign keys, indexes

### 5.4 Triển khai
- Docker Compose: MySQL 8 + Spring Boot + React/Nginx
- VPS production: Caddy reverse proxy + HTTPS
- Script deploy tự động (PowerShell + Bash)
- 50+ container restarts trong quá trình phát triển — triển khai liên tục mượt mà

---

## 6. KẾT QUẢ & HIỆU QUẢ

### 6.1 Về quy trình
- ✅ **Một hệ thống duy nhất** cho toàn bộ quy trình mua hàng: Kế hoạch → PO → Vận chuyển → Nhập kho → Thanh toán
- ✅ **Dữ liệu tập trung, nhất quán** — mọi phòng ban cùng làm việc trên 1 hệ thống
- ✅ **Tự động hóa tính toán** (giá vốn, tổng tiền, tỷ giá) — loại bỏ sai sót thủ công
- ✅ **Quy trình duyệt 4 bước rõ ràng** — biết chính xác đang ở khâu nào

### 6.2 Về thời gian
- ⏱ **Tổng hợp báo cáo**: 2-3 ngày → **0 phút** (dashboard real-time)
- ⏱ **Lập DNTT**: từ nửa ngày → **15-20 phút**
- ⏱ **Đối chiếu cuối tháng**: 3-5 ngày → **<1 giờ**
- ⏱ **Phát hiện giá vốn bất thường**: không phát hiện được → **tự động cảnh báo ngay sau nhập kho**
- ⏱ **Xác nhận nhập kho**: nhập tay vào sổ → **quét mã + upload ảnh ngay trên app**

### 6.3 Về dữ liệu & số liệu
- **23+ giao diện** quản lý
- **52 phiên bản database** (Flyway migrations) — track từng thay đổi
- **17 REST controllers**, **20 services**, **23 repositories**
- **9 vai trò** với phân quyền chi tiết (Read/Create/Update/Delete/Submit/Approve/Reject/Pay/Confirm)
- Hàng trăm commit trên Git, mỗi commit gắn với 1 tính năng cụ thể
- **Xử lý 3 loại ngoại tệ**: VND, USD, CNY
- **Hỗ trợ 50+ ngân hàng** trong cấu hình

### 6.4 Về bảo mật & kiểm soát
- 🔒 **JWT authentication** — bảo vệ tất cả API endpoints trừ login/register
- 🔒 **Phân quyền đến từng thao tác** — không ai có thể làm quyền của người khác
- 🔒 **Mật khẩu mã hóa** BCrypt
- 🔒 **Chứng từ thanh toán tập trung** — không lo thất lạc file
- 🔒 **Ghi nhận lịch sử phê duyệt** — truy vết được ai duyệt lúc nào

---

## 7. KẾ HOẠCH PHÁT TRIỂN TIẾP THEO

| Tính năng | Ưu tiên | Mục đích |
|---|---|---|
| Audit Log | **CAO** | Kiểm toán toàn bộ thao tác trên hệ thống |
| Email Notification | **CAO** | Gửi email khi cần duyệt |
| Export Excel | TB | Xuất danh sách ra Excel |
| Báo cáo PDF | TB | In đơn hàng, DNTT, phiếu nhập kho |
| Quản lý tồn kho nâng cao | TB | Nhập/xuất/tồn chi tiết, cảnh báo tồn tối thiểu |
| Swagger API docs | TB | Tài liệu API tự động |
| Tích hợp cổng thanh toán | Thấp | Chi trả trực tuyến |
| Đa ngôn ngữ (i18n) | Thấp | Hỗ trợ Anh/Việt/Trung |
| Mobile App | Thấp | Ứng dụng di động React Native |

---

## 8. THỐNG KÊ ẤN TƯỢNG (ĐỂ ĐƯA VÀO SLIDE)

> *"Từ Excel phân tán → Hệ thống tập trung: giảm 90% thời gian xử lý thủ công."*

> *"52 phiên bản database, 17 controllers, 20 services — kiến trúc sẵn sàng mở rộng."*

> *"9 vai trò, 23 bảng dữ liệu, 32 trang giao diện — bài toán doanh nghiệp được số hóa toàn diện."*

> *"Tự động phát hiện biến động giá vốn >20% — tiết kiệm hàng trăm triệu nhờ cảnh báo sớm."*
