<#
.SYNOPSIS
  Deploy SGI Procurement System using Docker Compose
.DESCRIPTION
  Builds and deploys backend + frontend containers.
  Copy .env.example to .env and edit before running.
#>

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== SGI Procurement - Deployment Script ===" -ForegroundColor Cyan

# 1. Check .env
$envFile = Join-Path $ROOT ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "[WARN] .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item (Join-Path $ROOT ".env.example") $envFile
    Write-Host "[INFO] Please edit .env with your configuration, then re-run this script." -ForegroundColor Yellow
    exit 0
}

# 2. Build & start
Write-Host "[1/3] Building and starting containers..." -ForegroundColor Green
docker compose -f (Join-Path $ROOT "docker-compose.yml") --env-file $envFile up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker Compose failed!" -ForegroundColor Red
    exit 1
}

# 3. Check health
Write-Host "[2/3] Waiting for services to be healthy..." -ForegroundColor Green
Start-Sleep -Seconds 15

try {
    $resp = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/login" -Method OPTIONS -TimeoutSec 10
    Write-Host "[OK] Backend is reachable" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Backend not yet reachable, check logs: docker compose logs -f" -ForegroundColor Yellow
}

# 4. Summary
Write-Host "[3/3] Deployment summary:" -ForegroundColor Green
Write-Host "  Frontend : http://localhost" -ForegroundColor White
Write-Host "  Backend  : http://localhost:8080/api" -ForegroundColor White
Write-Host "  MySQL    : localhost:3307" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs : docker compose logs -f" -ForegroundColor Gray
Write-Host "  Stop      : docker compose down" -ForegroundColor Gray
Write-Host "  Restart   : docker compose restart" -ForegroundColor Gray
