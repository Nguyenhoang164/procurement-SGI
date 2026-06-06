#!/bin/bash
# ============================================================
# SCRIPT DEPLOY procurement.sgiholding.com.vn
# Chạy trên VPS (sau khi SSH vào)
# Usage: bash deploy.sh
# ============================================================

set -e

# ========== MÀU SẮC ==========
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  DEPLOY procurement.sgiholding.com.vn${NC}"
echo -e "${CYAN}============================================${NC}"

# ========== BƯỚC 1: BACKUP APACHE ==========
echo -e "${YELLOW}[1/8] Backup Apache config...${NC}"
BACKUP_DIR="/root/apache-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r /etc/apache2/sites-available/ $BACKUP_DIR/
cp -r /etc/apache2/sites-enabled/ $BACKUP_DIR/
cp /etc/apache2/ports.conf $BACKUP_DIR/ 2>/dev/null || true
echo -e "${GREEN}  => Backup tại: $BACKUP_DIR${NC}"

# ========== BƯỚC 2: CÀI DOCKER ==========
echo -e "${YELLOW}[2/8] Kiểm tra Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo "  => Docker chưa cài. Đang cài đặt..."
    curl -fsSL https://get.docker.com | sh
    apt install docker-compose-plugin -y
    echo -e "${GREEN}  => Docker đã cài xong${NC}"
else
    echo -e "${GREEN}  => Docker đã có sẵn${NC}"
fi

# ========== BƯỚC 3: CLONE CODE ==========
echo -e "${YELLOW}[3/8] Clone code từ GitHub...${NC}"
cd /opt
if [ -d "/opt/procurement" ]; then
    echo "  => Thư mục đã tồn tại. Cập nhật code mới..."
    cd /opt/procurement
    git fetch origin deploy
    git reset --hard origin/deploy
else
    git clone -b deploy https://github.com/Nguyenhoang164/procurement-SGI.git procurement
    cd /opt/procurement
fi
echo -e "${GREEN}  => Code đã sẵn sàng${NC}"

# ========== BƯỚC 4: BUILD & CHẠY DOCKER ==========
echo -e "${YELLOW}[4/8] Build và chạy Docker containers...${NC}"
cd /opt/procurement
docker compose up -d --build
echo -e "${GREEN}  => Docker containers đã chạy${NC}"

# Kiểm tra containers
sleep 5
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}  => Trạng thái: OK${NC}"
else
    echo -e "${RED}  => LỖI: Containers không chạy. Kiểm tra logs: docker compose logs${NC}"
    exit 1
fi

# Kiểm tra frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo -e "${GREEN}  => Frontend chạy OK trên port 3000${NC}"
else
    echo -e "${RED}  => LỖI: Frontend không phản hồi trên port 3000${NC}"
    echo -e "${YELLOW}  => Chạy: docker compose logs frontend${NC}"
fi

# ========== BƯỚC 5: ENABLE MOD PROXY ==========
echo -e "${YELLOW}[5/8] Bật mod Apache proxy...${NC}"
a2enmod proxy proxy_http proxy_balancer lbmethod_byrequests headers ssl rewrite 2>/dev/null || true

# ========== BƯỚC 6: TẠO VIRTUALHOST ==========
echo -e "${YELLOW}[6/8] Tạo VirtualHost cho subdomain...${NC}"
cat > /etc/apache2/sites-available/procurement.sgiholding.com.vn.conf << 'VHOST'
<VirtualHost *:80>
    ServerName procurement.sgiholding.com.vn
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    ErrorLog ${APACHE_LOG_DIR}/procurement-error.log
    CustomLog ${APACHE_LOG_DIR}/procurement-access.log combined
</VirtualHost>
VHOST

# Kích hoạt site
a2ensite procurement.sgiholding.com.vn.conf
systemctl reload apache2
echo -e "${GREEN}  => VirtualHost đã tạo${NC}"

# ========== BƯỚC 7: CẤP SSL ==========
echo -e "${YELLOW}[7/8] Cấp SSL cho subdomain...${NC}"
if command -v certbot &> /dev/null; then
    certbot --apache -d procurement.sgiholding.com.vn --non-interactive --agree-tos --email admin@sgiholding.com.vn || true
    echo -e "${GREEN}  => SSL đã cấp (nếu thành công)${NC}"
else
    echo "  => Certbot chưa cài. Đang cài đặt..."
    apt install certbot python3-certbot-apache -y
    certbot --apache -d procurement.sgiholding.com.vn --non-interactive --agree-tos --email admin@sgiholding.com.vn || echo -e "${YELLOW}  => Chạy thủ công sau: certbot --apache -d procurement.sgiholding.com.vn${NC}"
fi

# ========== BƯỚC 8: KIỂM TRA & HOÀN TẤT ==========
echo -e "${YELLOW}[8/8] Kiểm tra tổng thể...${NC}"
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  DEPLOY HOÀN TẤT!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  Link: ${CYAN}https://procurement.sgiholding.com.vn${NC}"
echo ""
echo -e "  Docker containers:"
docker compose ps
echo ""
echo -e "  Backup Apache: ${YELLOW}$BACKUP_DIR${NC}"
echo -e "  Rollback: ${YELLOW}bash /opt/procurement/rollback.sh $BACKUP_DIR${NC}"
echo ""

# Tạo script rollback
cat > /opt/procurement/rollback.sh << 'ROLLBACK'
#!/bin/bash
# Rollback deployment
# Usage: bash rollback.sh <backup_dir>

if [ -z "$1" ]; then
    echo "Usage: bash rollback.sh <backup_dir>"
    echo "Example: bash rollback.sh /root/apache-backup-20240101_120000"
    exit 1
fi

BACKUP_DIR="$1"

echo "=== ROLLBACK ==="

# Restore Apache
echo "[1/3] Phục hồi Apache config..."
cp -r $BACKUP_DIR/sites-available/* /etc/apache2/sites-available/
cp -r $BACKUP_DIR/sites-enabled/* /etc/apache2/sites-enabled/
cp $BACKUP_DIR/ports.conf /etc/apache2/ 2>/dev/null || true
systemctl reload apache2
echo "  => Apache đã phục hồi"

# Stop Docker
echo "[2/3] Dừng Docker containers..."
cd /opt/procurement
docker compose down
echo "  => Docker đã dừng"

# Remove VirtualHost
echo "[3/3] Xóa VirtualHost subdomain..."
a2dissite procurement.sgiholding.com.vn.conf 2>/dev/null || true
rm -f /etc/apache2/sites-available/procurement.sgiholding.com.vn.conf
systemctl reload apache2
echo "  => VirtualHost đã xóa"

echo ""
echo "=== ROLLBACK HOÀN TẤT ==="
echo "Web chính sgiholding.com.vn đã trở lại nguyên trạng"
ROLLBACK

chmod +x /opt/procurement/rollback.sh
