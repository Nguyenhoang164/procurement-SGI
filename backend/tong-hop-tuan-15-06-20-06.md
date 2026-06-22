# Tổng hợp tuần 15/06 – 20/06

## I. Tính năng đã hoàn thành

### 1. Phân trang & tìm kiếm (15-16/06)
- Server-side pagination cho PO, DNTT, ProductCost, CostAlert
- Global search cải tiến với date range filters
- JOIN FETCH optimization, thêm DB indexes
- Performance tuning

### 2. Vai trò Nhân viên Mua hàng (PURCHASING) (18/06)
- Thêm role `PURCHASING` vào hệ thống RBAC
- Phân quyền: được phép tạo, sửa, xem đơn hàng
- Multi-select items từ kế hoạch tuần để tạo đơn hàng
- Carry-over ghi chú, phương thức vận chuyển "Đi hàng" từ plan sang PO

### 3. Đơn hàng (PO) & Vận đơn (Waybill) (19-20/06)
- Cascade delete đơn hàng, delete all
- Department filter, chi phí vận chuyển (cân nặng, đơn giá VC, số kiện)
- Waybill: tự động gen mã, load sản phẩm, auto quantity, multi-order
- Freight info, shipping method per PO item

### 4. Import Excel đơn hàng
- Map 30+ cột từ file Excel mẫu
- Tự động sinh poCode (`IMP-YYYYMMDD-NNN`)
- Auto tạo sản phẩm vào danh sách giá vốn
- Lookup posCode từ productName
- Detect header động (dòng 1 hoặc 2)
- Xử lý ô FORMULA, Excel serial date, đa định dạng ngày tháng

### 5. Dashboard & Audit Log
- Audit log: ghi lại tất cả thay đổi dữ liệu (ai, cái gì, khi nào)
- Cost variance display, biểu đồ xu hướng 6 tháng
- Date filters, tooltips, color coding, pagination cho cost alerts

### 6. Sửa lỗi
- Hiển thị VND, xử lý tỷ giá
- Excel header có newline/nội dung trong ngoặc
- Filter width, regenerate codes trùng sequence
- Lấy 4 ký tự đầu tên SP (bỏ ký tự đặc biệt)

---

## II. Mục tiêu tuần sau

### 1. Hoàn thiện tính năng cho Nhân viên Mua hàng

| Việc cần làm | Mô tả |
|-------------|-------|
| Giao diện riêng | Màn hình dashboard & menu phù hợp với quy trình NV Mua hàng |
| Quy trình duyệt đơn | Cho phép PURCHASING submit PO lên L1, theo dõi trạng thái duyệt |
| Tích hợp kế hoạch tuần | Lọc kế hoạch tuần đã duyệt để tạo đơn, hiển thị SKU/biến thể |
| Cập nhật đơn hàng | Sửa/xóa đơn hàng ở trạng thái DRAFT, cập nhật chi phí vận chuyển |

### 2. Import data đơn hàng cho PKD 2

| Việc cần làm | Mô tả |
|-------------|-------|
| Map cột còn thiếu | Bổ sung 15+ cột chưa map: Ngày đến kho, Ngày thanh toán tiền hàng/cước, Tiền hàng (ngoại tệ), Phí order, Đơn giá VC quốc tế, Cước VC quốc tế, Phí ship nội địa, Tổng tiền lô, GV đầy đủ 1 SP, Phương thức TT, Đã cọc/Còn phải TT, Mã viết tắt SP, NCC, Khối lượng |
| Xử lý đặc thù | Ngày về thực tế, Người check, SL kho nhận – cần thêm field hoặc mapping riêng |
| Kiểm tra hàng loạt | Import file Excel thực tế của PKD 2, verify dữ liệu đầu ra chính xác |
| Tự động hóa | Gán đúng `initiatorDepartment = PKD2`, `createdBy` từ user đang import |
