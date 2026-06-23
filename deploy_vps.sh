#!/bin/bash

# Script deploy lên VPS
# Tuân thủ theo hướng dẫn trong HUONG_DAN_DEPLOY.md

echo "🚀 Bắt đầu deploy hệ thống Mua hàng SGI lên VPS..."
echo ""

# SSH vào VPS
echo "1️⃣  SSH vào VPS (103.90.225.141)..."
ssh root@103.90.225.141 << 'ENDSSH'
    echo "2️⃣  Clone code mới nhất từ GitHub..."
    cd /opt
    rm -rf procurement
    git clone -b deploy https://github.com/Nguyenhoang164/procurement-SGI.git procurement
    cd /opt/procurement

    echo "3️⃣  Chạy script deploy tự động..."
    bash deploy.sh

    echo ""
    echo "4️⃣  Kiểm tra trạng thái container..."
    docker compose ps

    echo ""
    echo "5️⃣  Kiểm tra log backend..."
    docker compose logs --tail=50 backend

    echo ""
    echo "✅ Deploy hoàn tất!"
    echo "🌐 Truy cập: https://procurement.sgiholding.com.vn"
ENDSSH

echo ""
echo "🎉 Deploy thành công!"