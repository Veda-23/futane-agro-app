@echo off
title Futane Direct Customer Storefront
cd /d "%~dp0"
echo ===================================================
echo  STARTING FUTANE DIRECT CUSTOMER STOREFRONT
echo  URL: http://localhost:4202
echo ===================================================
node scripts/dev/run-storefront.js
pause
