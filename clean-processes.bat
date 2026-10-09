@echo off
echo Cleaning stale Futane Agro ERP development processes...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0clean-processes.ps1"
pause
