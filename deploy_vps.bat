@echo off
REM ============================================================
REM Deploy procurement.sgiholding.com.vn to VPS
REM Double-click this file to run
REM Requires: PuTTY (plink) or Git Bash (OpenSSH)
REM ============================================================

set VPS_HOST=103.90.225.141
set VPS_USER=root
set VPS_PASSWORD=YOnOT1YRqfEIp6ZUuU1T
set PROJECT_DIR=/opt/procurement

echo ============================================
echo  Deploying to VPS...
echo  Host: %VPS_HOST%
echo ============================================
echo.

REM Try plink first (PuTTY)
where plink >nul 2>&1
if %errorlevel% equ 0 (
    plink -ssh -pw %VPS_PASSWORD% -batch %VPS_USER%@%VPS_HOST% "cd %PROJECT_DIR% && git pull origin deploy && bash deploy.sh"
    goto DONE
)

REM Try OpenSSH
where ssh >nul 2>&1
if %errorlevel% equ 0 (
    echo Password: %VPS_PASSWORD%
    ssh %VPS_USER%@%VPS_HOST% "cd %PROJECT_DIR% && git pull origin deploy && bash deploy.sh"
    goto DONE
)

echo ERROR: Install Git Bash (https://git-scm.com/download/win) or PuTTY
pause
goto EOF

:DONE
echo.
echo ============================================
echo  Checking containers...
echo ============================================
echo.
ping -n 15 127.0.0.1 >nul
plink -ssh -pw %VPS_PASSWORD% -batch %VPS_USER%@%VPS_HOST% "docker compose ps" 2>nul || ssh %VPS_USER%@%VPS_HOST% "docker compose ps"
echo.
echo ============================================
echo  Deploy complete!
echo  URL: https://procurement.sgiholding.com.vn
echo ============================================
pause
