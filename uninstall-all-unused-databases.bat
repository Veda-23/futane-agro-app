@echo off
title FUTANE AGRO ERP - PURGE ALL UNUSED DATABASES (MYSQL + ORACLE)
color 0C
echo =================================================================
echo   FUTANE AGRO ERP — REMOVING MYSQL + ORACLE FROM ROOT (FORCEFUL)
echo   (Only PostgreSQL 16 will remain on your laptop)
echo =================================================================
echo.
echo Requesting Windows Administrator Elevation...
powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0scripts\uninstall-all-unused-databases.ps1\"' -Verb RunAs"
echo.
echo The uninstallation process has been launched with Administrator privileges.
echo If Windows shows a User Account Control (UAC) prompt, please click YES.
echo =================================================================
pause
