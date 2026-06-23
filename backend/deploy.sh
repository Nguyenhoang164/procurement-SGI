#!/bin/bash
# VPS Deployment Script - Run on VPS
# Usage: bash <(curl -s https://raw.githubusercontent.com/Nguyenhoang164/procurement-SGI/deploy/deploy.sh)

set -e

echo "=========================================="
echo "🚀 PROCUREMENT SGI - AUTO DEPLOY"
echo "=========================================="
echo ""

# Backup hiện tại (nếu có)
if [ -d "/opt/procurement" ]; then
    echo "📦 Backup code hiện tại..."
    BACKUP_DIR="/root/procurement-backup-$(date +%Y%m%d_%H%M%S)"
    cp -r /opt/procurement "$BACKUP_DIR"
    echo "✅ Backup: $BACKUP_DIR"
else
    echo "📝 Clone project mới..."
fi

# Clone/Update code
cd /opt
if [ -d "procurement" ]; then
    cd procurement
    echo "🔄 Pull code mới từ Git..."
    git pull origin deploy
else
    echo "📥 Clone code từ GitHub..."
    git clone -b deploy https://github.com/Nguyenhoang164/procurement-SGI.git procurement
    cd procurement
fi

echo ""
echo "🐳 Build & Start Docker containers..."
docker compose down 2>/dev/null || true
docker compose up -d --build --force-recreate

echo ""
echo "⏳ Chờ containers khởi động..."
sleep 10

# Kiểm tra trạng thái
echo ""
echo "📊 Trạng thái các dịch vụ:"
docker compose ps

# Cấu hình Apache (nếu không có)
if ! grep -q "procurement.sgiholding.com.vn" /etc/apache2/sites-available/*.conf 2>/dev/null; then
    echo ""
    echo "🔧 Cấu hình Apache VirtualHost..."

    # Tạo VirtualHost configuration
    cat > /etc/apache2/sites-available/procurement.sgiholding.com.vn.conf <<'EOF'
<VirtualHost *:80>
    ServerName procurement.sgiholding.com.vn
    ServerAlias www.procurement.sgiholding.com.vn

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    ProxyPass /api/ http://127.0.0.1:8080/api/
    ProxyPassReverse /api/ http://127.0.0.1:8080/api/

    ErrorLog ${APACHE_LOG_DIR}/procurement-error.log
    CustomLog ${APACHE_LOG_DIR}/procurement-access.log combined
</VirtualHost>
EOF

    a2ensite procurement.sgiholding.com.vn.conf
    a2enmod proxy
    a2enmod proxy_http
    systemctl reload apache2

    echo "✅ VirtualHost đã cấu hình"
fi

echo ""
echo "=========================================="
echo "✅ DEPLOY HOÀN TẤT!"
echo "=========================================="
echo ""
echo "📌 Thông tin:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8080"
echo "   Database: localhost:3306"
echo ""
echo "🌐 Truy cập web:"
echo "   https://procurement.sgiholding.com.vn"
echo ""
echo "📋 Lệnh hữu ích:"
echo "   - Xem logs:      docker compose logs -f"
echo "   - Restart:       docker compose restart"
echo "   - Stop:          docker compose down"
echo ""

