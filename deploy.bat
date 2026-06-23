@echo off
chcp 65001 >nul
echo ========================================
echo   DEPLOY PHÂN QUYỀN VẬN ĐƠN LÊN VPS
echo ========================================
echo.
echo 🚀 Bắt đầu deploy...
echo.

REM Kiểm tra xem có Git không
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git không được cài đặt. Vui lòng cài đặt Git trước.
    pause
    exit /b 1
)

REM Kiểm tra xem có SSH không
ssh -V >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ SSH không được cài đặt. Vui lòng cài đặt OpenSSH trước.
    pause
    exit /b 1
)

echo ✅ Git và SSH đã được cài đặt
echo.
echo 📤 Đang push code lên GitHub...
git push origin deploy

if %errorlevel% neq 0 (
    echo ❌ Lỗi khi push code lên GitHub.
    pause
    exit /b 1
)

echo.
echo ✅ Code đã được push lên GitHub thành công!
echo.
echo 🚀 Bắt đầu deploy lên VPS...
echo.
echo ⚠️  Bạn sẽ được yêu cầu nhập mật khẩu SSH: YOnOT1YRqfEIp6ZUuU1T
echo.

REM Chạy script deploy
bash deploy_vps.sh

if %errorlevel% neq 0 (
    echo.
    echo ❌ Lỗi khi deploy lên VPS.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ DEPLOY THÀNH CÔNG!
echo ========================================
echo.
echo 🌐 Truy cập: https://procurement.sgiholding.com.vn
echo.
echo 📋 Để kiểm tra log:
echo    docker compose logs -f backend
echo.
pause