# HƯỚNG DẪN DEPLOY procurement.sgiholding.com.vn

**Yêu cầu:** Không ảnh hưởng đến web chính sgiholding.com.vn (Apache)

**Cách làm:**
- Docker chạy riêng: MySQL + Backend + Frontend
- Frontend expose ra **port 3000** (KHÔNG dùng port 80/443)
- Thêm VirtualHost trong Apache để proxy subdomain → localhost:3000
- Dùng certbot để cấp SSL cho subdomain

---

## PHẦN 1: TẠO DATABASE

Không dùng phpMyAdmin của web chính. MySQL sẽ chạy trong Docker, database riêng hoàn toàn.

---

## PHẦN 2: SSH VÀO VPS

Mở Terminal (Mac/Linux) hoặc PowerShell (Windows), gõ:

```bash
ssh root@103.90.225.141
```

Mật khẩu: **YOnOT1YRqfEIp6ZUuU1T**

(Gõ `yes` nếu hỏi fingerprint, nhập mật khẩu)

---

## PHẦN 3: CÀI DOCKER

```bash
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin -y
```

---

## PHẦN 4: UPLOAD CODE LÊN VPS

**Bước 1 - Trên máy local** (mở PowerShell ở thư mục `C:\Users\kamit\Desktop\procurement-SGI`):

```powershell
# Xóa thư mục build cũ
Remove-Item -Recurse -Force backend\build, frontend\build, backend\target, frontend\node_modules -ErrorAction SilentlyContinue

# Nén project
Compress-Archive -Path "backend\*", "frontend\*", "docker-compose.yml" -DestinationPath "deploy.zip" -Force

# Copy lên VPS
scp deploy.zip root@103.90.225.141:/opt/
```

(Nhập mật khẩu VPS: **YOnOT1YRqfEIp6ZUuU1T**)

**Bước 2 - Trên VPS** (cửa sổ SSH):

```bash
cd /opt
apt install unzip -y
mkdir -p procurement
unzip deploy.zip -d procurement/
rm deploy.zip
```

---

## PHẦN 5: BUILD & CHẠY DOCKER

```bash
cd /opt/procurement
docker compose up -d --build
```

Lần đầu mất **5-15 phút** (download image, build Java, build React). Đợi đến khi thấy dấu nhắc.

**Kiểm tra:**

```bash
docker compose ps
```

Phải thấy 3 container: `sgi-mysql`, `sgi-backend`, `sgi-frontend` đều **Up**.

```bash
docker compose logs backend --tail 20
```

Cuối log phải có dòng `Started SgiProcurementBackendApplication`.

Lúc này frontend đã chạy ở `http://localhost:3000` trên VPS.

---

## PHẦN 6: THÊM VIRTUALHOST VÀO APACHE CHO SUBDOMAIN

### 6.1. Bật mod proxy của Apache

```bash
a2enmod proxy proxy_http proxy_balancer lbmethod_byrequests headers ssl rewrite
systemctl restart apache2
```

### 6.2. Tạo file cấu hình cho subdomain

```bash
nano /etc/apache2/sites-available/procurement.sgiholding.com.vn.conf
```

Dán nội dung sau:

```apache
<VirtualHost *:80>
    ServerName procurement.sgiholding.com.vn

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    ErrorLog ${APACHE_LOG_DIR}/procurement-error.log
    CustomLog ${APACHE_LOG_DIR}/procurement-access.log combined
</VirtualHost>
```

Nhấn **Ctrl+X** → **Y** → **Enter**.

### 6.3. Kích hoạt site

```bash
a2ensite procurement.sgiholding.com.vn.conf
systemctl reload apache2
```

### 6.4. Cấp SSL cho subdomain

```bash
# Cài certbot
apt install certbot python3-certbot-apache -y

# Cấp chứng chỉ
certbot --apache -d procurement.sgiholding.com.vn
```

(Nhập email admin@sgiholding.com.vn, chọn **A** (Agree), **N** (No sharing), **2** (Redirect) khi được hỏi)

Certbot sẽ tự động sửa file cấu hình Apache để thêm SSL.

---

## PHẦN 7: TRỎ DNS

Vào trang quản lý DNS của **sgiholding.com.vn**, thêm bản ghi:

| Loại | Tên | Giá trị | TTL |
|------|-----|---------|-----|
| A | `procurement` | **103.90.225.141** | 300 |

Sau 5-10 phút, mở trình duyệt vào `https://procurement.sgiholding.com.vn`

---

## XỬ LÝ LỖI THƯỜNG GẶP

### Apache không khởi động được sau khi bật mod proxy

```bash
journalctl -u apache2 --no-pager -n 20
```

### Cổng 3000 bị chặn

Kiểm tra Docker frontend có chạy không:

```bash
curl http://localhost:3000
```

Nếu không thấy gì:

```bash
docker compose logs frontend
```

### Docker build lỗi

```bash
docker compose build --no-cache backend
docker compose build --no-cache frontend
docker compose up -d
```

---

## CÁC LỆNH CẦN BIẾT

```bash
# Docker
docker compose ps                          # Xem trạng thái
docker compose logs -f backend            # Xem log backend
docker compose logs -f frontend           # Xem log frontend
docker compose restart                     # Khởi động lại
docker compose down                        # Dừng hẳn

# Build lại backend sau khi sửa code
docker compose build backend
docker compose up -d backend

# Build lại frontend sau khi sửa code
docker compose build frontend
docker compose up -d frontend

# Apache
systemctl reload apache2                   # Reload cấu hình
systemctl restart apache2                  # Khởi động lại

# Log
tail -f /var/log/apache2/procurement-error.log
tail -f /var/log/apache2/procurement-access.log
```
