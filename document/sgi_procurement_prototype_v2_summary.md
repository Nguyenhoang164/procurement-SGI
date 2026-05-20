# Tóm tắt case chức năng và cấu trúc dự án

## 1. Cấu trúc file và thư mục
- Thư mục `document` chứa:
  - `sgi_procurement_prototype_v2.html`: prototype giao diện SPA cho hệ thống SGI Procurement.
  - `01_Tai_lieu_nghiep_vu_Mua_hang_v3.docx`: tài liệu nghiệp vụ mua hàng.
  - `02_Tai_lieu_ky_thuat_Mua_hang_v3.docx`: tài liệu kỹ thuật mua hàng.
- File HTML là nguồn chính định nghĩa layout, screens và luồng nghiệp vụ.

## 2. Cấu trúc dự án trong file HTML
- Sidebar điều hướng chính gồm:
  - Dashboard
  - Kế hoạch tuần
  - Đơn hàng
  - Đề nghị TT
  - Nhận hàng
  - Giá vốn SP
  - Danh mục SP
  - Cấu hình
- Các màn hình chính hiển thị bằng `div.screen` và bật/tắt bằng JS hàm `go(key)`.
- Có thêm màn hình phụ:
  - `weekly-new` (Thêm kế hoạch nhập hàng)
  - `order-new` (Tạo đơn hàng mới)
  - `order-detail` (Chi tiết đơn hàng)
  - `dntt-detail` (Chi tiết DNTT)
  - `receive` (Xác nhận nhận hàng)
  - `notif` (Thông báo)

## 3. Các case chức năng chính
1. Dashboard tổng quan
   - Hiển thị số liệu tổng quan: số đơn tháng, đơn đang vận chuyển, tổng tiền hàng, số DNTT chờ phê duyệt.
   - Biểu đồ xu hướng và nguồn nhập.
   - Bảng đơn hàng gần đây.

2. Kế hoạch tuần
   - Danh sách kế hoạch nhập hàng tuần.
   - Chức năng thêm kế hoạch mới (PKD1).
   - Chức năng chuyển từ kế hoạch sang tạo đơn hàng.

3. Tạo đơn hàng
   - Danh sách đơn hàng và bộ lọc tìm kiếm.
   - Form tạo đơn hàng đầy đủ (PKD2).
   - Tự tính các chỉ số: tiền hàng, cước VC QT, tổng tiền lô, giá vốn 1 SP, còn phải thanh toán.
   - Gửi duyệt đơn.

4. Chi tiết đơn hàng
   - Theo dõi tiến trình đơn hàng.
   - Hiển thị tổng tiền lô và chi phí chi tiết.
   - Hiển thị thông tin đặt hàng và chi phí vận chuyển.

5. Đề nghị thanh toán (DNTT)
   - Danh sách DNTT và trạng thái duyệt.
   - Lập DNTT mới.
   - Chi tiết DNTT với phê duyệt/từ chối và upload/download chứng từ.

6. Nhận hàng / kho
   - Danh sách đơn hàng cần nhận hàng.
   - Form xác nhận nhận hàng.
   - Lưu thông tin ngày về, số lượng nhận, tình trạng hàng và chứng từ.

7. Giá vốn sản phẩm
   - Bảng giá vốn trung bình gia quyền theo mã POS.
   - So sánh giá vốn lô gần nhất và giá vốn trung bình.

8. Danh mục sản phẩm
   - Bảng mã POS, tên sản phẩm, viết tắt, danh mục, trạng thái.

9. Cấu hình hệ thống
   - Quản lý người dùng.
   - Quản lý dropdown danh mục như nguồn nhập, hình thức VC, phương thức thanh toán.

10. Thông báo
    - Hiển thị các thông báo liên quan đến DNTT, đơn sắp về kho, thanh toán.

## 4. Thứ tự ưu tiên thực hiện theo các stage
### Stage 1 — Luồng chính
1. Kế hoạch tuần (xem/sửa) và thêm kế hoạch nhập hàng.
2. Tạo đơn hàng từ kế hoạch.
3. Danh sách đơn hàng và chi tiết đơn.

### Stage 2 — Quy trình thanh toán và kho
1. Đề nghị thanh toán (DNTT) và chi tiết DNTT.
2. Nhận hàng và xác nhận kho.

### Stage 3 — Hỗ trợ dữ liệu và quản trị
1. Danh mục sản phẩm.
2. Giá vốn sản phẩm.
3. Cấu hình hệ thống.
4. Dashboard tổng quan.

### Stage 4 — Hoàn thiện UX / tiện ích
1. Notification.
2. Export Excel.
3. Upload chứng từ.
4. Hiệu ứng thông báo trạng thái và badge.

## 5. Ghi chú
- File `.docx` chưa được đọc nội dung bằng công cụ này, nhưng là tài liệu bổ trợ nghiệp vụ và kỹ thuật.
- File HTML tự thân đã mô tả rõ các màn hình và luồng nghiệp vụ toàn diện.
