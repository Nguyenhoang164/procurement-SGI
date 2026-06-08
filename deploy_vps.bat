@echo off
plink -ssh -pw YOnOT1YRqfEIp6ZUuU1T -batch root@103.90.225.141 ^
  "cd /opt/procurement && ^
   git pull origin deploy && ^
   docker compose down && ^
   docker compose build --no-cache && ^
   docker compose up -d"
