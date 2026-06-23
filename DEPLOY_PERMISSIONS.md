# Hướng dẫn Deploy Phân quyền Vận đơn lên VPS

## ✅ Đã hoàn thành các thay đổi:

### Backend (Java Spring Boot):
1. **WaybillController.java** - Cập nhật phân quyền:
   - `POST /v1/waybills` - Chỉ ADMIN và CEO
   - `PUT /v1/waybills/{id}` - Chỉ ADMIN và CEO
   - `PUT /v1/waybills/{id}/confirm` - Chỉ ADMIN và CEO
   - `PATCH /v1/waybills/{id}/status` - Chỉ ADMIN và CEO
   - `DELETE /v1/waybills/{id}` - Chỉ ADMIN và CEO
   - Các endpoint GET vẫn cho phép nhiều role xem

### Frontend (React):
1. **permissions.js** - Cập nhật hàm kiểm tra quyền:
   - `canCrudWaybill(user)` - Chỉ ADMIN và CEO
   - `canConfirmWaybill(user)` - Chỉ ADMIN và CEO

2. **WaybillNew.js** - Thêm logic kiểm tra quyền khi tạo mới vận đơn

3. **WaybillDetail.js** - Đã có sẵn logic kiểm tra quyền
4. **WaybillList.js** - Đã có sẵn logic kiểm tra quyền

## 🚀 Cách Deploy lên VPS:

### Phương án 1: Chạy script (Khuyên dùng)

```bash
# Mở PowerShell hoặc Terminal
cd C:\Users\kamit\Desktop\procurement-SGI
bash deploy_vps.sh
```

### Phương án 2: Thực hiện thủ công theo hướng dẫn

#### Bước 1: SSH vào VPS
```bash
ssh root@103.90.225.141
```
Mật khẩu: `YOnOT1YRqfEIp6ZUuU1T`

#### Bước 2: Clone code và chạy deploy
```bash
cd /opt
rm -rf procurement
git clone -b deploy https://github.com/Nguyenhoang164/procurement-SGI.git procurement
cd /opt/procurement
bash deploy.sh
```

#### Bước 3: Kiểm tra trạng thái
```bash
docker compose ps
docker compose logs -f backend
```

#### Bước 4: Truy cập web
Mở trình duyệt: `https://procurement.sgiholding.com.vn`

## 🔄 Nếu có lỗi, Rollback:

```bash
cd /opt/procurement
docker compose down

# Xóa VirtualHost
a2dissite procurement.sgiholding.com.vn.conf
rm /etc/apache2/sites-available/procurement.sgiholding.com.vn.conf
systemctl reload apache2
```

## 📋 Các role và quyền vận đơn:

| Role | Xem vận đơn | Tạo vận đơn | Sửa vận đơn | Xác nhận vận đơn | Xóa vận đơn |
|------|-------------|-------------|-------------|------------------|-------------|
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| CEO | ✅ | ✅ | ✅ | ✅ | ✅ |
| WAREHOUSE | ✅ | ❌ | ❌ | ❌ | ❌ |
| ACCOUNTANT | ✅ | ❌ | ❌ | ❌ | ❌ |
| CHIEF_ACCOUNTANT | ✅ | ❌ | ❌ | ❌ | ❌ |
| SALES | ✅ | ❌ | ❌ | ❌ | ❌ |
| SALES_MANAGER | ✅ | ❌ | ❌ | ❌ | ❌ |
| PURCHASING | ✅ | ❌ | ❌ | ❌ | ❌ |
| USER | ✅ | ❌ | ❌ | ❌ | ❌ |
| PENDING | ✅ | ❌ | ❌ | ❌ | ❌ |

## 📝 Commit Details:
- Commit: `f0a3bc5`
- Branch: `deploy`
- Files changed: 3 files (25 insertions, 12 deletions)

## ✅ Sau khi deploy:
1. Code đã được push lên GitHub
2. Script deploy đã sẵn sàng
3. Hướng dẫn chi tiết đã được tạo
4. Quyền hạn đã được cập nhật đúng yêu cầu

---

**Lưu ý:** Script sẽ tự động:
- Clone code mới nhất từ GitHub
- Chạy script deploy.sh
- Kiểm tra trạng thái container
- Hiển thị log backend

Chạy script và web sẽ được update đúng như yêu cầu! 🎉