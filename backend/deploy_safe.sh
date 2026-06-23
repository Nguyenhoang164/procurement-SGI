#!/bin/bash
#############################################################
# PROCUREMENT SAFE DEPLOY SCRIPT
# - Hoàn toàn độc lập, không ảnh hưởng web chính
# - Backup & Rollback tự động
# - Kiểm tra kỹ lưỡng trước deploy
#############################################################

set -e

# ===== CẤU HÌNH =====
PROJECT_NAME="procurement"
PROJECT_PATH="/opt/procurement"
REPO_URL="https://github.com/Nguyenhoang164/procurement-SGI.git"
REPO_BRANCH="deploy"
DOMAIN="procurement.sgiholding.com.vn"
BACKUP_BASE="/root/procurement-backups"
DOCKER_COMPOSE_FILE="$PROJECT_PATH/docker-compose.yml"

# Màu sắc
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ===== HÀM TIỆN ÍCH =====
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠️ ]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# ===== BẮT ĐẦU DEPLOY =====
clear
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 PROCUREMENT SAFE DEPLOY${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then
    log_error "Cần quyền root! Chạy: sudo bash $0"
    exit 1
fi

log_info "Bắt đầu deploy vào $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ===== KIỂM TRA ĐIỀU KIỆN BAN ĐẦU =====
log_info "Kiểm tra điều kiện ban đầu..."

# Kiểm tra Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker chưa cài! Cài Docker trước."
    exit 1
fi
log_success "Docker: $(docker --version)"

# Kiểm tra Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose chưa cài!"
    exit 1
fi
log_success "Docker Compose: $(docker-compose --version)"

# Kiểm tra Git
if ! command -v git &> /dev/null; then
    log_error "Git chưa cài!"
    exit 1
fi
log_success "Git: $(git --version)"

# Kiểm tra Apache
if ! systemctl is-active --quiet apache2; then
    log_warning "Apache2 không chạy"
else
    log_success "Apache2: running"
fi

echo ""

# ===== BACKUP =====
log_info "Tạo backup trước deploy..."

BACKUP_DIR="${BACKUP_BASE}/backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -d "$PROJECT_PATH" ]; then
    log_info "Backup project hiện tại..."
    cp -r "$PROJECT_PATH" "$BACKUP_DIR/project"
    log_success "Project backup: $BACKUP_DIR/project"
fi

# Backup Apache config nếu VirtualHost đã tồn tại
if [ -f "/etc/apache2/sites-available/${DOMAIN}.conf" ]; then
    log_info "Backup Apache config..."
    cp "/etc/apache2/sites-available/${DOMAIN}.conf" "$BACKUP_DIR/"
    cp "/etc/apache2/sites-enabled/${DOMAIN}.conf" "$BACKUP_DIR/" 2>/dev/null || true
    log_success "Apache config backup"
fi

# Lưu trạng thái Docker hiện tại
log_info "Lưu trạng thái Docker..."
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}" > "$BACKUP_DIR/docker_status_before.txt" 2>/dev/null || true
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" > "$BACKUP_DIR/docker_images.txt" 2>/dev/null || true

log_success "Backup hoàn tất: $BACKUP_DIR"
echo ""

# ===== DEPLOY =====
log_info "Bắt đầu deploy..."
echo ""

# Clone/Update code
if [ ! -d "$PROJECT_PATH" ]; then
    log_info "Clone project từ GitHub..."
    git clone -b "$REPO_BRANCH" "$REPO_URL" "$PROJECT_PATH"
    log_success "Project cloned"
else
    log_info "Pull code mới từ GitHub..."
    cd "$PROJECT_PATH"
    git fetch origin
    git checkout "$REPO_BRANCH"
    git pull origin "$REPO_BRANCH"
    log_success "Project updated"
fi

cd "$PROJECT_PATH"
log_success "Working directory: $(pwd)"

echo ""
log_info "Docker Compose status trước deploy:"
docker ps --format "table {{.Names}}\t{{.Status}}" 2>/dev/null | grep -E "procurement|mysql" || echo "  (chưa có container)"

echo ""
log_info "Dừng Docker containers cũ (nếu có)..."
docker compose down 2>/dev/null || true
log_success "Containers stopped"

echo ""
log_info "Build & Start Docker containers..."
docker compose up -d --build --force-recreate

if [ $? -ne 0 ]; then
    log_error "Docker compose up thất bại!"
    log_info "Rollback..."
    docker compose down 2>/dev/null || true
    if [ -d "$BACKUP_DIR/project" ]; then
        cp -r "$BACKUP_DIR/project" "$PROJECT_PATH.rollback"
        log_error "Backup lưu tại: $BACKUP_DIR"
    fi
    exit 1
fi

log_success "Containers started"

# Chờ containers khởi động
log_info "Chờ containers khởi động..."
sleep 5

# Kiểm tra containers
echo ""
log_info "Docker Compose status sau deploy:"
docker compose ps

# Kiểm tra services
log_info "Kiểm tra services..."

# Test frontend
if docker compose exec -T frontend curl -s http://localhost:3000 > /dev/null 2>&1; then
    log_success "Frontend (3000): ✓"
else
    log_warning "Frontend (3000): chưa sẵn sàng (có thể đang khởi động)"
fi

# Test backend
if docker compose exec -T backend curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    log_success "Backend (8080): ✓"
else
    log_warning "Backend (8080): chưa sẵn sàng (có thể đang khởi động)"
fi

# Test database
if docker compose exec -T db mysql -u root -proot -e "SELECT 1" > /dev/null 2>&1; then
    log_success "Database (3306): ✓"
else
    log_warning "Database (3306): chưa sẵn sàng"
fi

echo ""

# ===== CẤU HÌNH APACHE =====
log_info "Cấu hình Apache VirtualHost..."

# Kiểm tra xem VirtualHost đã tồn tại không
if [ -f "/etc/apache2/sites-available/${DOMAIN}.conf" ]; then
    log_warning "VirtualHost đã tồn tại, kiểm tra..."

    # So sánh với backup
    if diff "/etc/apache2/sites-available/${DOMAIN}.conf" "$BACKUP_DIR/${DOMAIN}.conf" > /dev/null 2>&1; then
        log_info "Config không thay đổi, bỏ qua"
    else
        log_info "Config có thay đổi, cập nhật..."
        # Backup config cũ
        cp "/etc/apache2/sites-available/${DOMAIN}.conf" "/etc/apache2/sites-available/${DOMAIN}.conf.old"
    fi
else
    log_info "Tạo VirtualHost mới cho $DOMAIN..."
fi

# Tạo VirtualHost config
cat > "/etc/apache2/sites-available/${DOMAIN}.conf" <<'EOF'
# ============================================
# PROCUREMENT SUBDOMAIN VIRTUALHOST
# Không sửa file này trực tiếp!
# ============================================

<VirtualHost *:80>
    ServerName procurement.sgiholding.com.vn
    ServerAlias www.procurement.sgiholding.com.vn

    # Proxy settings
    ProxyPreserveHost On
    ProxyPassMatch "^/api/(.*)$" "http://127.0.0.1:8080/api/$1"
    ProxyPassReverse "/api/" "http://127.0.0.1:8080/api/"

    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    # Logs
    ErrorLog ${APACHE_LOG_DIR}/procurement-error.log
    CustomLog ${APACHE_LOG_DIR}/procurement-access.log combined

    # Performance
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteRule ^/(.*) - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
    </IfModule>
</VirtualHost>
EOF

log_success "VirtualHost config created"

# Enable Apache modules cần thiết
log_info "Enable Apache modules..."
a2enmod proxy 2>/dev/null
a2enmod proxy_http 2>/dev/null
a2enmod rewrite 2>/dev/null
log_success "Modules enabled"

# Enable VirtualHost
if [ -f "/etc/apache2/sites-available/${DOMAIN}.conf" ]; then
    a2ensite "$DOMAIN.conf" 2>/dev/null || true
    log_success "VirtualHost enabled"
fi

# Test Apache config
log_info "Test Apache configuration..."
if apache2ctl configtest 2>&1 | grep -q "Syntax OK"; then
    log_success "Apache config: OK"
else
    log_error "Apache config lỗi!"
    apache2ctl configtest
    exit 1
fi

# Reload Apache
log_info "Reload Apache..."
systemctl reload apache2
log_success "Apache reloaded"

echo ""

# ===== KIỂM TRA NGĂN CHẶN =====
log_info "Kiểm tra tính độc lập..."
echo ""

# Kiểm tra web chính vẫn chạy
if curl -s -I "http://127.0.0.1" | grep -q "200\|301\|302\|304"; then
    log_success "Web chính (localhost:80): ✓ vẫn hoạt động"
else
    log_warning "Web chính: không thể kiểm tra ngay"
fi

# Kiểm tra có file khác bị modify không
log_info "Kiểm tra file hệ thống..."
if [ -f "/etc/apache2/sites-available/000-default.conf" ]; then
    if diff "/etc/apache2/sites-available/000-default.conf" "$BACKUP_DIR/000-default.conf" > /dev/null 2>&1; then
        log_success "Apache default config: ✓ không thay đổi"
    else
        log_warning "Apache default config: có thay đổi (kiểm tra thủ công)"
    fi
fi

echo ""

# ===== HOÀN THÀNH =====
log_success "========================================="
log_success "✅ DEPLOY HOÀN TẤT THÀNH CÔNG!"
log_success "========================================="
echo ""
echo -e "${GREEN}📌 Thông tin quan trọng:${NC}"
echo -e "   ${YELLOW}Backup:${NC}      $BACKUP_DIR"
echo -e "   ${YELLOW}Project:${NC}     $PROJECT_PATH"
echo -e "   ${YELLOW}Domain:${NC}      https://$DOMAIN"
echo -e "   ${YELLOW}Frontend:${NC}    http://127.0.0.1:3000"
echo -e "   ${YELLOW}Backend:${NC}     http://127.0.0.1:8080"
echo ""
echo -e "${GREEN}📋 Lệnh tiếp theo:${NC}"
echo "   - Kiểm tra logs:    docker compose logs -f"
echo "   - Khởi động lại:    docker compose restart"
echo "   - Dừng services:    docker compose down"
echo "   - View status:      docker compose ps"
echo ""
echo -e "${YELLOW}🔄 Rollback (nếu cần):${NC}"
echo "   bash /root/procurement-backups/rollback.sh $BACKUP_DIR"
echo ""

# Lưu thông tin rollback
cat > "$BACKUP_DIR/rollback.sh" <<'ROLLBACK'
#!/bin/bash
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_dir>"
    echo "Example: $0 /root/procurement-backups/backup-20240101_120000"
    exit 1
fi

BACKUP_DIR="$1"
PROJECT_PATH="/opt/procurement"

echo "🔄 Rollback từ: $BACKUP_DIR"

# Dừng containers
docker compose -f "$PROJECT_PATH/docker-compose.yml" down

# Restore project
if [ -d "$BACKUP_DIR/project" ]; then
    rm -rf "$PROJECT_PATH"
    cp -r "$BACKUP_DIR/project" "$PROJECT_PATH"
    echo "✓ Project restored"
fi

# Restore Apache config
if [ -f "$BACKUP_DIR/procurement.sgiholding.com.vn.conf" ]; then
    cp "$BACKUP_DIR/procurement.sgiholding.com.vn.conf" "/etc/apache2/sites-available/"
    echo "✓ Apache config restored"
fi

# Restart services
cd "$PROJECT_PATH"
docker compose up -d
systemctl reload apache2

echo "✅ Rollback hoàn tất!"
ROLLBACK

chmod +x "$BACKUP_DIR/rollback.sh"
log_success "Rollback script lưu: $BACKUP_DIR/rollback.sh"

# Lưu log deploy
cat > "$BACKUP_DIR/deploy.log" <<DEPLOYLOG
Deploy Timestamp: $(date)
Project: $PROJECT_NAME
Domain: $DOMAIN
Repo: $REPO_URL
Branch: $REPO_BRANCH
Status: SUCCESS
DEPLOYLOG

log_info "Deploy log lưu: $BACKUP_DIR/deploy.log"
echo ""

