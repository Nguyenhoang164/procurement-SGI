# Hướng dẫn sử dụng file update_vps.bat

## 📋 Mục đích
File `update_vps.bat` giúp bạn tự động hóa việc deploy và quản lý ứng dụng trên VPS từ máy Windows mà không cần phải SSH thủ công.

## ✅ Yêu cầu trước khi sử dụng

### 1. Cài đặt OpenSSH Client (nếu chưa có)
Windows 10/11 đã có sẵn OpenSSH. Kiểm tra:
```cmd
where ssh
```

Nếu chưa có, bật tính năng:
```cmd
:: Bật OpenSSH Client
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

### 2. Thiết lập SSH Authentication (CHỌN 1 TRONG 2 PHƯƠNG ÁN)

#### 🔑 Phương án 1: SSH Key Authentication (KHUYẾN NGHỊ)
Bước 1: Tạo SSH key trên máy Windows
```cmd
ssh-keygen
```
- Nhấn Enter để chấp nhận đường dẫn mặc định
- Có thể đặt passphrase hoặc để trống

Bước 2: Copy public key lên VPS
```cmd
:: Sử dụng ssh-copy-id (nếu có)
ssh-copy-id root@103.90.225.141

:: HOẶC copy thủ công:
:: 1. Mở file C:\Users\<tên_người_dùng>\.ssh\id_rsa.pub
:: 2. Copy toàn bộ nội dung
:: 3. SSH vào VPS: ssh root@103.90.225.141
:: 4. Thêm vào file: echo "<nội_dung_public_key>" >> ~/.ssh/authorized_keys
:: 5. Cấp quyền: chmod 600 ~/.ssh/authorized_keys
```

#### 🔐 Phương án 2: Sử dụng sshpass (tự động nhập password)
Cài đặt sshpass:
```cmd
:: Sử dụng Chocolatey (khuyến nghị)
choco install sshpass

:: HOẶC download thủ công từ: https://sourceforge.net/projects/sshpass/
```

Sau khi cài, file batch sẽ tự động phát hiện và sử dụng.

## 🚀 Cách sử dụng

1. **Chạy file batch**
   - Nhấp đôi vào file `update_vps.bat`
   - HOẶC chạy từ Command Prompt: `update_vps.bat`

2. **Menu chức năng**
   ```
   1. 🚀 DEPLOY MỚI (clone repo + chạy deploy.sh)
   2. 🔄 CẬP NHẬT CODE (git pull + rebuild)
   3. 🔙 ROLLBACK (khôi phục từ backup)
   4. 📊 KIỂM TRA TRẠNG THÁI
   5. ⚡ KHỞI ĐỘNG LẠI DỊCH VỤ
   6. 📝 HIỂN THỊ LOG (backend/frontend)
   7. 🔌 TEST KẾT NỐI SSH
   8. 📁 PULL CODE LOCAL (trên máy bạn)
   9. 🏗 PUSH & DEPLOY (local -> VPS)
   0. ❌ THOÁT
   ```

3. **Nhập lựa chọn** và nhấn Enter

## 📝 Chi tiết các chức năng

### 1. DEPLOY MỚI
- Clone repo từ GitHub (branch deploy)
- Chạy script deploy.sh trên VPS
- Tự động setup Docker containers, Apache VirtualHost, SSL
- Sau khi hoàn tất: Truy cập https://procurement.sgiholding.com.vn

### 2. CẬP NHẬT CODE
- Git pull code mới nhất từ branch deploy
- Rebuild Docker containers
- Khởi động lại dịch vụ

### 3. ROLLBACK
- Khôi phục từ file backup Apache
- Cần nhập tên file backup (ví dụ: /root/apache-backup-20240101_120000)

### 4. KIỂM TRA TRẠNG THÁI
- Hiển thị trạng thái Docker containers
- Hiển thị trạng thái Apache

### 5. KHỞI ĐỘNG LẠI DỊCH VỤ
- Docker compose down + up
- Reload Apache

### 6. HIỂN THỊ LOG
- Lựa chọn: Backend, Frontend, Apache Error, Apache Access
- Hiển thị log thời gian thực (Ctrl+C để dừng)

### 7. TEST KẾT NỐI SSH
- Kiểm tra kết nối đến VPS
- Hiển thị hostname và uptime nếu thành công

### 8. PULL CODE LOCAL
- Pull code mới nhất trên máy local
-Không tác động đến VPS

### 9. PUSH & DEPLOY
- **Bước 1:** Git add, commit, push lên GitHub
- **Bước 2:** SSH vào VPS, pull code mới, rebuild containers
- **Bước 3:** Khởi động lại dịch vụ
- Tự động hóa toàn bộ quy trình từ local đến production

## ⚠️ Lưu ý quan trọng

1. **Password VPS** đã được lưu trong file batch
   - Nếu dùng SSH key, password không được sử dụng
   - Nếu dùng sshpass, password sẽ được truyền tự động

2. **Thư mục project local**
   - Hiện tại: `C:\Users\kamit\Desktop\procurement-SGI`
   - Sửa trực tiếp trong file batch nếu cần

3. **Thông tin VPS**
   - IP: 103.90.225.141
   - User: root
   - Path: /opt/procurement
   - Branch: deploy

4. **Bảo mật**
   - Không chia sẻ file batch với người khác
   - Nếu dùng SSH key, bảo mật private key

## 🔧 Cấu hình bổ sung

### Đổi cài đặt
Mở file `update_vps.bat` và sửa các biến sau:
```batch
set "VPS_IP=103.90.225.141"
set "VPS_USER=root"
set "VPS_PASSWORD=YOnOT1YRqfEIp6ZUuU1T"
set "PROJECT_PATH=/opt/procurement"
set "REPO_URL=https://github.com/Nguyenhoang164/procurement-SGI.git"
set "REPO_BRANCH=deploy"
set "LOCAL_PROJECT=C:\Users\kamit\Desktop\procurement-SGI"
```

### Sử dụng SSH key khác
Nếu bạn có SSH key ở đường dẫn khác:
```batch
set "SSH_CMD=ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i C:\path\to\your\private_key %VPS_USER%@%VPS_IP%"
```

## 🛠 Khắc phục sự cố

### Lỗi: "ssh: command not found"
- Bật OpenSSH Client: `Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0`

### Lỗi: "Permission denied (publickey)"
- Chưa copy SSH key lên VPS
- Thực hiện: `ssh-copy-id root@103.90.225.141`

### Lỗi: "sshpass: command not found"
- Cài sshpass: `choco install sshpass`
- HOẶC sử dụng SSH key

### Lỗi: "Could not open input file: %TEMP_SCRIPT%"
- Vấn đề với biến môi trường TEMP
- Kiểm tra: `echo %TEMP%` có trỏ đến thư mục tồn tại không

### Kết nối SSH thất bại
- Kiểm tra VPS có cho phép kết nối SSH (port 22)
- Kiểm tra IP VPS đúng không
- Kiểm tra username/password đúng không

## 📞 Liên hệ hỗ trợ
Nếu gặp vấn đề, kiểm tra:
1. File HUONG_DAN_DEPLOY.md để xem quy trình deploy thủ công
2. Kết nối SSH thủ công: `ssh root@103.90.225.141`
3. Kiểm tra Docker và Apache trên VPS
