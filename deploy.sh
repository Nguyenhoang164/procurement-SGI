#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  DEPLOY procurement.sgiholding.com.vn${NC}"
echo -e "${CYAN}============================================${NC}"

echo -e "${YELLOW}[1/3] Cài Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    apt install docker-compose-plugin -y
    echo -e "${GREEN}  => Docker đã cài${NC}"
else
    echo -e "${GREEN}  => Docker đã có${NC}"
fi

echo -e "${YELLOW}[2/3] Build & chạy containers...${NC}"
cd /opt/procurement
docker system prune -f --volumes
sleep 2
docker compose down
docker compose up -d --build --no-cache
echo -e "${GREEN}  => Docker containers đã chạy${NC}"

sleep 5

echo -e "${YELLOW}[3/3] Kiểm tra...${NC}"
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}  => All containers UP${NC}"
else
    echo -e "${RED}  => LỖI! Chạy: docker compose logs${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  DEPLOY HOÀN TẤT!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  Truy cập: ${CYAN}https://procurement.sgiholding.com.vn${NC}"
echo -e "  Rollback: ${YELLOW}cd /opt/procurement && docker compose down${NC}"
echo ""

docker compose ps
