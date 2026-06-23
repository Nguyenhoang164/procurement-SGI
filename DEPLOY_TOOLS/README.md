# 🚀 CÔNG CỤ TỰ ĐỘNG DEPLOY & QUẢN LÝ VPS

Dành cho project **procurement.sgiholding.com.vn**

## 📁 Danh sách file

```
DEPLOY_TOOLS/
├── START.bat               # Khởi động công cụ (chọn phiên bản)
├── update_vps.bat          # Phiên bản đầy đủ (9 chức năng)
├── update_vps_simple.bat   # Phiên bản đơn giản (5 chức năng)
├── config.bat              # File cấu hình
├── README.md               # Tài liệu này
└── HUONG_DAN_SU_DUNG_BAT.md # Hướng dẫn chi tiết
```

## ⚡ Bắt đầu nhanh

### Bước 1: Thiết lập SSH Authentication

**Lựa chọn A: SSH Key (Khuyến nghị)**
```cmd
:: Tạo SSH key
ssh-keygen

:: Copy lên VPS (nếu có ssh-copy-id)
ssh-copy-id root@103.90.225.141

:: HOẶC copy thủ công:
:: 1. Mở file C:\Users\<username>\.ssh\id_rsa.pub
:: 2. Copy nội dung
:: 3. SSH vào VPS và chạy:
::    echo "<nội_dung_public_key>" >> ~/.ssh/authorized_keys
::    chmod 600 ~/.ssh/authorized_keys
```

**Lựa chọn B: sshpass**
```cmd
:: Cài sshpass
choco install sshpass
```

### Bước 2: Chạy công cụ

**Cách 1: Sử dụng START.bat (khuyến nghị)**
```cmd
START.bat
```

**Cách 2: Chạy trực tiếp**
- Phiên bản đầy đủ: `update_vps.bat`
- Phiên bản đơn giản: `update_vps_simple.bat`

## 🎯 Chức năng chính

### Phiên bản đầy đủ (update_vps.bat)

| STT | Chức năng | Mô tả |
|-----|-----------|------|
| 1 | 🚀 Deploy mới | Clone repo + chạy deploy.sh |
| 2 | 🔄 Cập nhật code | Git pull + rebuild containers |
| 3 | 🔙 Rollback | Khôi phục từ backup |
| 4 | 📊 Kiểm tra trạng thái | Docker + Apache status |
| 5 | ⚡ Khởi động lại | Restart containers + Apache |
| 6 | 📝 Hiển thị log | Backend/Frontend/Apache logs |
| 7 | 🔌 Test SSH | Kiểm tra kết nối |
| 8 | 📁 Pull local | Git pull trên máy local |
| 9 | 🏗 Push & Deploy | Push lên GitHub + deploy lên VPS |

### Phiên bản đơn giản (update_vps_simple.bat)

| STT | Chức năng | Mô tả |
|-----|-----------|------|
| 1 | Deploy mới | Clone repo + chạy deploy.sh |
| 2 | Cập nhật code | Git pull + rebuild |
| 3 | Khởi động lại | Restart dịch vụ |
| 4 | Kiểm tra trạng thái | Docker + Apache status |
| 5 | Test SSH | Kiểm tra kết nối |

## 📖 Cấu hình

Mở file `config.bat` để sửa thông tin:

```batch
:: Thông tin VPS
set "VPS_IP=103.90.225.141"
set "VPS_USER=root"
set "VPS_PASSWORD=YOnOT1YRqfEIp6ZUuU1T"

:: Thông tin project
set "PROJECT_PATH=/opt/procurement"
set "REPO_URL=https://github.com/Nguyenhoang164/procurement-SGI.git"
set "REPO_BRANCH=deploy"

:: Thông tin local
set "LOCAL_PROJECT=C:\Users\kamit\Desktop\procurement-SGI"

:: Cấu hình SSH (chọn 1)
set "SSH_KEY_PATH=%USERPROFILE%\.ssh\id_rsa"
:: HOẶC
:: set "USE_SSHPASS=1"
```

## 🔧 Yêu cầu hệ thống

- Windows 10/11
- OpenSSH Client (đã có sẵn)
- Git (để pull/push code)
- SSH key HOẶC sshpass

## 📚 Tài liệu

- [Hướng dẫn sử dụng chi tiết](HUONG_DAN_SU_DUNG_BAT.md)
- [Hướng dẫn deploy thủ công](../HUONG_DAN_DEPLOY.md)

## 💡 Tips

1. **Sử dụng SSH key** an toàn hơn sshpass
2. **Test kết nối trước** khi chạy deploy
3. **Backup dữ liệu** trước khi rollback
4. **Kiểm tra log** nếu gặp lỗi

## ❓ Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra file `HUONG_DAN_DEPLOY.md`
2. Thử kết nối SSH thủ công: `ssh root@103.90.225.141`
3. Kiểm tra Docker và Apache trên VPS
