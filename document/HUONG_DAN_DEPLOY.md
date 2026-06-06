# Hướng Dẫn Chuẩn Bị & Đẩy Code Lên Server

## 1. Yêu Cầu Hệ Thống (Server)

| Phần mềm | Phiên bản | Ghi chú |
|---|---|---|
| Docker | 24+ | Bắt buộc |
| Docker Compose | V2 Plugin | Bắt buộc |
| Git | latest | Để clone code |

Kiểm tra server:
```bash
docker --version
docker compose version
git --version
```

Nếu chưa có Docker, cài theo: https://docs.docker.com/engine/install/

---

## 2. Cấu Trúc File Deployment

Sau khi chuẩn bị, project sẽ có các file sau:

```
procurement-SGI/
├── backend/
│   ├── Dockerfile                  # Multi-stage build: Gradle → JRE 17
│   ├── .dockerignore
│   └── src/main/resources/
│       ├── application.properties  # Dev (local)
│       └── application-prod.properties  # Production (dùng env vars)
├── frontend/
│   ├── Dockerfile                  # Build React → Nginx
│   ├── .dockerignore
│   ├── nginx.conf                  # Reverse proxy API → backend container
│   └── .env.production             # REACT_APP_API_URL
├── docker-compose.yml              # MySQL + Backend + Frontend
├── deploy.ps1                      # Script deploy (Windows)
├── .env.example                    # Mẫu file biến môi trường
└── .gitignore
```

---

## 3. Các Bước Chuẩn Bị

### Bước 1: Cấu hình biến môi trường

Tạo file `.env` từ mẫu:

```bash
cp .env.example .env
```

Sửa nội dung file `.env`:

```env
# MySQL
MYSQL_ROOT_PASSWORD=your_strong_root_password
DB_USERNAME=sgi_user
DB_PASSWORD=your_strong_db_password

# JWT (quan trọng! Đổi secret mới)
JWT_SECRET=your-256-bit-secret-key-at-least-32-chars-long

# CORS - cho phép domain frontend truy cập API
CORS_ALLOWED_ORIGINS=http://your-domain.com,http://localhost
```

> ⚠️ **Lưu ý**: `JWT_SECRET` phải là chuỗi dài tối thiểu 32 ký tự. Không dùng secret mặc định trên production.

### Bước 2: Kiểm tra port

Đảm bảo server chưa có dịch vụ nào chiếm các port:

| Port | Dịch vụ |
|---|---|
| 80 | Frontend (Nginx) |
| 8080 | Backend API |
| 3307 | MySQL (mapped từ 3306 trong container) |

Có thể thay đổi port trong `docker-compose.yml` nếu cần.

### Bước 3: Clone code lên server

```bash
# SSH vào server, sau đó:
git clone <repository-url> /opt/sgi-procurement
cd /opt/sgi-procurement
```

### Bước 4: Copy file .env lên server

Dùng SCP hoặc copy thủ công file `.env` lên server:

```bash
# Từ máy local:
scp .env user@your-server:/opt/sgi-procurement/.env
```

### Bước 5: Build & chạy

```bash
cd /opt/sgi-procurement

# Dùng script deploy (nếu chạy Windows)
# Hoặc dùng trực tiếp:
docker compose --env-file .env up -d --build
```

Kiểm tra log:
```bash
docker compose logs -f
```

---

## 4. Kiểm Tra Sau Deploy

### Kiểm tra backend API:
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin@123"}'
```
Kết quả mong đợi: trả về JWT token.

### Kiểm tra frontend:
Mở trình duyệt: `http://<server-ip>`

### Kiểm tra database (tuỳ chọn):
```bash
docker exec -it sgi-mysql mysql -u sgi_user -p sgi_procurement
```

---

## 5. Lệnh Quản Lý Container

| Hành động | Lệnh |
|---|---|
| Xem log | `docker compose logs -f` |
| Dừng dịch vụ | `docker compose down` |
| Dừng + xoá volume | `docker compose down -v` (⚠️ mất data DB) |
| Restart dịch vụ | `docker compose restart` |
| Rebuild & start | `docker compose up -d --build` |
| Xem container đang chạy | `docker compose ps` |

---

## 6. Xử Lý Sự Cố Thường Gặp

### Backend không kết nối được MySQL
```bash
# Kiểm tra MySQL đã ready chưa
docker compose logs mysql

# Nếu lỗi auth, kiểm tra DB_USERNAME / DB_PASSWORD trong .env
```

### CORS error trên trình duyệt
- Kiểm tra `CORS_ALLOWED_ORIGINS` trong `.env` có chứa domain frontend không
- Frontend gọi API qua Nginx proxy (`/api/` → backend), nên thường không bị CORS

### 403 Forbidden khi gọi API
- Token hết hạn → login lại
- User không có quyền cho endpoint đó

### Port đã được sử dụng
```bash
# Kiểm tra port nào đang dùng
netstat -tulpn | grep -E ':(80|8080|3307)'

# Đổi port trong docker-compose.yml nếu cần
```

---

## 7. Nâng Cao (Tuỳ Chọn)

### Dùng Nginx làm reverse proxy chính (port 443 HTTPS)

Nếu muốn chạy HTTPS, thêm 1 Nginx container riêng ở ngoài để terminate SSL và trỏ về frontend container.

### Backup database

```bash
docker exec sgi-mysql mysqldump -u sgi_user -p sgi_procurement > backup_$(date +%Y%m%d).sql
```

### Update code mới

```bash
git pull
docker compose up -d --build
```

---

## 8. Checklist Trước Khi Deploy

- [ ] Đã đổi `JWT_SECRET` trong `.env`
- [ ] Đã đổi `MYSQL_ROOT_PASSWORD` và `DB_PASSWORD`
- [ ] `CORS_ALLOWED_ORIGINS` chứa đúng domain frontend
- [ ] Server đã cài Docker & Docker Compose
- [ ] Port 80, 8080, 3307 chưa bị chiếm
- [ ] Firewall đã mở port 80 (HTTP) và 8080 (API) nếu cần truy cập từ ngoài
- [ ] Code đã được commit và push lên git repository
- [ ] File `.env` **không** nằm trong git tracking (đã có trong `.gitignore`)
