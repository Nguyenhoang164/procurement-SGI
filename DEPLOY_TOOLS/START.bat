@echo off
chcp 65001 >nul
title Khởi động công cụ Deploy VPS
color 0A

echo.
echo   ┌─────────────────────────────────────────────────────────────┐
echo   │   🚀 CÔNG CỤ TỰ ĐỘNG DEPLOY & QUẢN LÝ VPS                     │
echo   │                                                             │
echo   │   Chọn phiên bản:                                             │
echo   │   1. Phiên bản đầy đủ (9 chức năng)                            │
echo   │   2. Phiên bản đơn giản (5 chức năng)                          │
echo   │   0. Thoát                                                   │
echo   └─────────────────────────────────────────────────────────────┘
echo.

set /p choice=Nhập lựa chọn (0-2): 

if "%choice%"=="1" (
    start update_vps.bat
    exit /b
)

if "%choice%"=="2" (
    start update_vps_simple.bat
    exit /b
)

if "%choice%"=="0" (
    exit /b
)

echo Lựa chọn không hợp lệ!
pause
exit /b
