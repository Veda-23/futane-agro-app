@echo off
title Futane Agro ERP - Secure Database Backup Engine
echo =================================================================
echo   FUTANE AGRO ERP - ENTERPRISE DATABASE BACKUP (AMAZON RDS STYLE)
echo =================================================================
echo   Taking hot compressed snapshot with SHA-256 integrity hash...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\backup-database-secure.ps1"
echo.
pause
