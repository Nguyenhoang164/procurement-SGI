@echo off
chcp 65001 >nul
title VPS Auto Deploy & Update - Simple Version
color 0A

:: ============================================
:: TẢI CẤU HÌNH TỪ FILE config.bat
:: ============================================
if exist "%~dp0config.bat" (
    call "%~dp0config.bat"
) else (
    echo ❌ Không tìm thấy file config.bat!
    echo   Vui lòng tạo file config.bat cùng thư mục với file này
    pause
    exit /b
)

setlocal enabledelayedexpansion

:: ============================================
:: KIỂM TRA CẤU HÌNH SSH
:: ============================================
:check_ssh
if defined USE_SSHPASS (
    where sshpass >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ sshpass chưa được cài đặt!
        echo   Cài sshpass: choco install sshpass
        pause
        exit /b
    )
    set "SSH_CMD=sshpass -p %VPS_PASSWORD% ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null %VPS_USER%@%VPS_IP%"
) else (
    if exist "%SSH_KEY_PATH%" (
        set "SSH_CMD=ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i %SSH_KEY_PATH% %VPS_USER%@%VPS_IP%"
    ) else (
        echo ⚠️  Không tìm thấy SSH key tại: %SSH_KEY_PATH%
        echo   Tạo SSH key: ssh-keygen
        echo   Copy lên VPS: ssh-copy-id %VPS_USER%@%VPS_IP%
        pause
        exit /b
    )
)

:: ============================================
:: MENU CHÍNH
:: ============================================
:menu
cls
echo.
echo   ┌─────────────────────────────────────────────────────────────┐
echo   │   VPS AUTO DEPLOY - Simple Version                          │
echo   │                                                             │
echo   │   1. Deploy mới (clone + deploy.sh)                            │
echo   │   2. Cập nhật code (git pull + rebuild)                        │
echo   │   3. Khởi động lại dịch vụ                                    │
echo   │   4. Kiểm tra trạng thái                                      │
echo   │   5. Test kết nối SSH                                         │
echo   │   0. Thoát                                                    │
echo   └─────────────────────────────────────────────────────────────┘
echo.
set /p choice=Chọn (0-5): 

if "%choice%"=="1" goto deploy
if "%choice%"=="2" goto update
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto test_ssh
if "%choice%"=="0" exit /b

echo Lựa chọn không hợp lệ!
pause
goto menu

:: ============================================
:: 1. DEPLOY MỚI
:: ============================================
:deploy
echo.
echo [DEPLOY] Đang deploy ứng dụng mới...
echo.

set "TEMP_SCRIPT=%tmp%\deploy_%random%.sh"
echo cd /opt > "%TEMP_SCRIPT%"
echo git clone -b %REPO_BRANCH% %REPO_URL% procurement >> "%TEMP_SCRIPT%"
echo cd %PROJECT_PATH% >> "%TEMP_SCRIPT%"
echo bash deploy.sh >> "%TEMP_SCRIPT%"

%SSH_CMD% "bash -s" < "%TEMP_SCRIPT%"
del "%TEMP_SCRIPT%" 2>nul

echo.
echo ✅ DEPLOY HOÀN TẤT!
echo   Website: https://procurement.sgiholding.com.vn
pause
goto menu

:: ============================================
:: 2. CẬP NHẬT CODE
:: ============================================
:update
echo.
echo [UPDATE] Đang cập nhật code...
echo.

set "TEMP_SCRIPT=%tmp%\update_%random%.sh"
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
:: 3. KHỞI ĐỘNG LẠI DỊCH VỤ
:: ============================================
:restart
echo.
echo [RESTART] Đang khởi động lại dịch vụ...
echo.

set "TEMP_SCRIPT=%tmp%\restart_%random%.sh"
echo cd %PROJECT_PATH% > "%TEMP_SCRIPT%"
echo docker compose down >> "%TEMP_SCRIPT%"
echo docker compose up -d >> "%TEMP_SCRIPT%"
echo systemctl reload apache2 >> "%TEMP_SCRIPT%"

%SSH_CMD% "bash -s" < "%TEMP_SCRIPT%"
del "%TEMP_SCRIPT%" 2>nul

echo.
echo ✅ KHỞI ĐỘNG LẠI HOÀN TẤT!
pause
goto menu

:: ============================================
:: 4. KIỂM TRA TRẠNG THÁI
:: ============================================
:status
echo.
echo [STATUS] Trạng thái dịch vụ:
echo.

%SSH_CMD% "cd %PROJECT_PATH% && docker compose ps && echo. && systemctl status apache2 | head -3"

echo.
pause
goto menu

:: ============================================
:: 5. TEST KẾT NỐI SSH
:: ============================================
:test_ssh
echo.
echo [TEST] Đang test kết nối SSH...
echo.

%SSH_CMD% -o ConnectTimeout=5 "echo 'Kết nối thành công!' && hostname"

if %errorlevel% equ 0 (
    echo ✅ KẾT NỐI THÀNH CÔNG!
) else (
    echo ❌ KẾT NỐI THẤT BẠI!
    echo   Kiểm tra IP, username, password hoặc SSH key
)

echo.
pause
goto menu
