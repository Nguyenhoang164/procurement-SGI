@echo off
chcp 65001 >nul
title VPS Auto Deploy & Update - procurement.sgiholding.com.vn
color 0A

setlocal enabledelayedexpansion

:: ============================================
:: CẤU HÌNH
:: ============================================
set "VPS_IP=103.90.225.141"
set "VPS_USER=root"
set "VPS_PASSWORD=YOnOT1YRqfEIp6ZUuU1T"
set "PROJECT_PATH=/opt/procurement"
set "REPO_URL=https://github.com/Nguyenhoang164/procurement-SGI.git"
set "REPO_BRANCH=deploy"
set "LOCAL_PROJECT=C:\Users\kamit\Desktop\procurement-SGI"

:: Kiểm tra xem có sshpass không (để truyền password tự động)
where sshpass >nul 2>&1
if %errorlevel% equ 0 (
    set "USE_SSHPASS=1"
) else (
    set "USE_SSHPASS=0"
)

:: ============================================
:: HÀM MÀU SẮC
:: ============================================
:color
set "temp_var=!errorlevel!"
color %2
echo %1
color %temp_var%
goto :eof

:skip_color_func

:: ============================================
:: HIỂN THỊ MENU
:: ============================================
:check_ssh_setup
:: Kiểm tra cấu hình SSH
if %USE_SSHPASS% equ 1 (
    set "SSH_CMD=sshpass -p %VPS_PASSWORD% ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null %VPS_USER%@%VPS_IP%"
) else (
    :: Sử dụng SSH key authentication
    :: Kiểm tra xem có private key không
    if exist "%USERPROFILE%\.ssh\id_rsa" (
        set "SSH_CMD=ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i %USERPROFILE%\.ssh\id_rsa %VPS_USER%@%VPS_IP%"
    ) else (
        echo   ⚠️  CẢNH BÁO: Không tìm thấy sshpass hay SSH key!
        echo   Để sử dụng tự động, bạn cần:
        echo   1. Cài sshpass (khuyến nghị): choco install sshpass
        echo   2. HOẶC thiết lập SSH key authentication:
        echo      - Tạo key: ssh-keygen
        echo      - Copy lên VPS: ssh-copy-id %VPS_USER%@%VPS_IP%
        echo.
        pause
        goto check_ssh_setup
    )
)

:menu
echo.
echo   ┌─────────────────────────────────────────────────────────────┐
echo   │   VPS AUTO DEPLOY & UPDATE - procurement.sgiholding.com.vn   │
echo   │                                                             │
echo   │   1. 🚀 DEPLOY MỚI (clone repo + chạy deploy.sh)              │
echo   │   2. 🔄 CẬP NHẬT CODE (git pull + rebuild)                      │
echo   │   3. 🔙 ROLLBACK (khôi phục từ backup)                           │
echo   │   4. 📊 KIỂM TRA TRẠNG THÁI                                       │
echo   │   5. ⚡ KHỞI ĐỘNG LẠI DỊCH VỤ                                     │
echo   │   6. 📝 HIỂN THỊ LOG (backend/frontend)                          │
echo   │   7. 🔌 TEST KẾT NỐI SSH                                         │
echo   │   8. 📁 PULL CODE LOCAL (trên máy bạn)                           │
echo   │   9. 🏗 PUSH & DEPLOY (local -> VPS)                              │
echo   │   0. ❌ THOÁT                                                   │
echo   └─────────────────────────────────────────────────────────────┘
echo.
set /p choice=Chọn chức năng (0-9): 

if "%choice%"=="1" goto deploy_new
if "%choice%"=="2" goto update_code
if "%choice%"=="3" goto rollback
if "%choice%"=="4" goto check_status
if "%choice%"=="5" goto restart_services
if "%choice%"=="6" goto show_logs
if "%choice%"=="7" goto test_ssh
if "%choice%"=="8" goto pull_local
if "%choice%"=="9" goto push_and_deploy
if "%choice%"=="0" goto exit_script

echo Lựa chọn không hợp lệ!
goto menu

:: ============================================
:: 1. DEPLOY MỚI
:: ============================================
:deploy_new
echo.
echo ┌─ DEPLOY MỚI ──────────────────────────────────────────────┐
echo │ Đang kết nối đến VPS %VPS_IP%...
echo └─────────────────────────────────────────────────────────────┘
echo.

:: Tạo file script tạm để chạy qua SSH
set "TEMP_SCRIPT=%tmp%\deploy_temp.sh"
echo cd /opt > "%TEMP_SCRIPT%"
echo git clone -b %REPO_BRANCH% %REPO_URL% procurement >> "%TEMP_SCRIPT%"
echo cd %PROJECT_PATH% >> "%TEMP_SCRIPT%"
echo bash deploy.sh >> "%TEMP_SCRIPT%"

:: Chạy script qua SSH
%SSH_CMD% "bash -s" < "%TEMP_SCRIPT%"

:: Xóa file tạm
del "%TEMP_SCRIPT%" 2>nul

echo.
echo ✅ DEPLOY HOÀN TẤT!
echo   Truy cập: https://procurement.sgiholding.com.vn
echo.
pause
goto menu

:: ============================================
:: 2. CẬP NHẬT CODE
:: ============================================
:update_code
echo.
echo ┌─ CẬP NHẬT CODE ─────────────────────────────────────────────┐
echo │ Đang cập nhật code trên VPS...
echo └─────────────────────────────────────────────────────────────┘
echo.

set "TEMP_SCRIPT=%tmp%\update_temp.sh"
echo cd %PROJECT_PATH% > "%TEMP_SCRIPT%"
echo git pull origin %REPO_BRANCH% >> "%TEMP_SCRIPT%"
echo docker compose down >> "%TEMP_SCRIPT%"
echo docker compose up -d --build >> "%TEMP_SCRIPT%"

%SSH_CMD% "bash -s" < "%TEMP_SCRIPT%"

del "%TEMP_SCRIPT%" 2>nul

echo.
echo ✅ CẬP NHẬT HOÀN TẤT!
pause
goto menu

:: ============================================
:: 3. ROLLBACK
:: ============================================
:rollback
echo.
echo ┌─ ROLLBACK ─────────────────────────────────────────────────────┐
set /p backup_file=Nhập tên file backup (ví dụ: /root/apache-backup-20240101_120000): 
echo └─────────────────────────────────────────────────────────────┘
echo.

if "%backup_file%"=="" (
    echo ❌ Bạn chưa nhập tên file backup!
    pause
    goto rollback
)

set "TEMP_SCRIPT=%tmp%\rollback_temp.sh"
echo cd %PROJECT_PATH% > "%TEMP_SCRIPT%"
echo bash rollback.sh %backup_file% >> "%TEMP_SCRIPT%"

%SSH_CMD% "bash -s" < "%TEMP_SCRIPT%"

del "%TEMP_SCRIPT%" 2>nul

echo.
echo ✅ ROLLBACK HOÀN TẤT!
pause
goto menu

:: ============================================
:: 4. KIỂM TRA TRẠNG THÁI
:: ============================================
:check_status
echo.
echo ┌─ KIỂM TRA TRẠNG THÁI ──────────────────────────────────────────┐
echo.

set "TEMP_SCRIPT=%tmp%\status_temp.sh"
echo echo "=== Docker Containers ===" > "%TEMP_SCRIPT%"
echo docker compose ps >> "%TEMP_SCRIPT%"
echo echo. >> "%TEMP_SCRIPT%"
echo echo "=== Apache Status ===" >> "%TEMP_SCRIPT%"
echo systemctl status apache2 >> "%TEMP_SCRIPT%" 2>&1 | head -5

%SSH_CMD% "bash -s" < "%TEMP_SCRIPT%"

del "%TEMP_SCRIPT%" 2>nul

echo.
pause
goto menu

:: ============================================
:: 5. KHỞI ĐỘNG LẠI DỊCH VỤ
:: ============================================
:restart_services
echo.
echo ┌─ KHỞI ĐỘNG LẠI DỊCH VỤ ───────────────────────────────────────┐
echo.

set "TEMP_SCRIPT=%tmp%\restart_temp.sh"
echo cd %PROJECT_PATH% > "%TEMP_SCRIPT%"
echo docker compose down >> "%TEMP_SCRIPT%"
echo docker compose up -d --build >> "%TEMP_SCRIPT%"
echo systemctl reload apache2 >> "%TEMP_SCRIPT%"

%SSH_CMD% "bash -s" < "%TEMP_SCRIPT%"

del "%TEMP_SCRIPT%" 2>nul

echo.
echo ✅ DỊCH VỤ ĐÃ KHỞI ĐỘNG LẠI!
pause
goto menu

:: ============================================
:: 6. HIỂN THỊ LOG
:: ============================================
:show_logs
echo.
echo ┌─ HIỂN THỊ LOG ───────────────────────────────────────────────────┐
echo   1. Backend Logs
echo   2. Frontend Logs
echo   3. Apache Error Log
echo   4. Apache Access Log
echo   0. Quay lại
echo.
set /p log_choice=Chọn loại log (0-4): 

if "%log_choice%"=="1" (
    set "LOG_CMD=docker compose logs -f backend"
) else if "%log_choice%"=="2" (
    set "LOG_CMD=docker compose logs -f frontend"
) else if "%log_choice%"=="3" (
    set "LOG_CMD=tail -f /var/log/apache2/procurement-error.log"
) else if "%log_choice%"=="4" (
    set "LOG_CMD=tail -f /var/log/apache2/procurement-access.log"
) else if "%log_choice%"=="0" (
    goto menu
) else (
    echo Lựa chọn không hợp lệ!
    pause
    goto show_logs
)

echo.
echo Đang hiển thị log... (Nhấn Ctrl+C để dừng)
echo.
%SSH_CMD% "cd %PROJECT_PATH% && %LOG_CMD%"
pause
goto menu

:: ============================================
:: 7. TEST KẾT NỐI SSH
:: ============================================
:test_ssh
echo.
echo ┌─ TEST KẾT NỐI SSH ──────────────────────────────────────────────┐
echo Đang test kết nối đến %VPS_IP%...
echo.

%SSH_CMD% -o ConnectTimeout=10 "echo '✅ KẾT NỐI THÀNH CÔNG!' && hostname && uptime"

if %errorlevel% neq 0 (
    echo ❌ KẾT NỐI THẤT BẠI!
    echo   Kiểm tra:
    echo   - IP VPS: %VPS_IP%
    echo   - Username: %VPS_USER%
    echo   - Firewall trên VPS có cho phép port 22?
    echo   - SSH key đã được copy lên VPS chưa?
) else (
    echo ✅ KẾT NỐI THÀNH CÔNG!
)

echo.
pause
goto menu

:: ============================================
:: 8. PULL CODE LOCAL
:: ============================================
:pull_local
echo.
echo ┌─ PULL CODE LOCAL ─────────────────────────────────────────────────┐
echo Đang pull code từ git tại: %LOCAL_PROJECT%
echo.

cd /d "%LOCAL_PROJECT%"
git pull origin %REPO_BRANCH%

if %errorlevel% equ 0 (
    echo ✅ PULL CODE THÀNH CÔNG!
) else (
    echo ❌ PULL CODE THẤT BẠI!
)

echo.
pause
goto menu

:: ============================================
:: 9. PUSH & DEPLOY (từ local lên VPS)
:: ============================================
:push_and_deploy
echo.
echo ┌─ PUSH & DEPLOY ───────────────────────────────────────────────────┐
echo.

:: Bước 1: Push code lên GitHub
cd /d "%LOCAL_PROJECT%"
echo [1/3] Đang push code lên GitHub...
git add .
git commit -m "Auto deploy via batch script - %date% %time%"
git push origin %REPO_BRANCH%

if %errorlevel% neq 0 (
    echo ❌ PUSH THẤT BẠI!
    pause
    goto menu
)

echo ✅ Push thành công!
echo.

:: Bước 2: Cập nhật trên VPS
set "TEMP_SCRIPT=%tmp%\push_deploy_temp.sh"
echo cd %PROJECT_PATH% > "%TEMP_SCRIPT%"
echo git pull origin %REPO_BRANCH% >> "%TEMP_SCRIPT%"
echo docker compose down >> "%TEMP_SCRIPT%"
echo docker compose up -d --build >> "%TEMP_SCRIPT%"
echo echo "✅ Deploy hoàn tất!" >> "%TEMP_SCRIPT%"

%SSH_CMD% "bash -s" < "%TEMP_SCRIPT%"

del "%TEMP_SCRIPT%" 2>nul

echo.
echo ✅ PUSH & DEPLOY HOÀN TẤT!
echo   Truy cập: https://procurement.sgiholding.com.vn
echo.
pause
goto menu

:: ============================================
:: THOÁT
:: ============================================
:exit_script
echo.
echo   Cảm ơn bạn đã sử dụng công cụ deploy!
echo.
exit /b
