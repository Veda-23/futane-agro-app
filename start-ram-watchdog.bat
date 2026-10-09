@echo off
title Futane Agro - Automatic RAM Watchdog (8GB Laptop Guardian)
echo =================================================================
echo   FUTANE AGRO ERP - STARTING AUTOMATIC RAM WATCHDOG
echo   Keeps your 8GB laptop lag-free & prevents hung/frozen states.
echo   You can minimize this window to background.
echo =================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ram-watchdog.ps1"
pause
