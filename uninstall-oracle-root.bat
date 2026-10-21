@echo off
title FUTANE AGRO ERP - FORCEFUL ORACLE ROOT REMOVAL
color 0C
echo =================================================================
echo   FUTANE AGRO ERP — REMOVING ORACLE DATABASE FROM ROOT (FORCEFUL)
echo =================================================================
echo.
echo Requesting Windows Administrator Elevation...
powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0scripts\uninstall-oracle-completely.ps1\"' -Verb RunAs"
echo.
echo The uninstallation process has been launched with Administrator privileges.
echo If Windows shows a User Account Control (UAC) prompt, please click YES.
echo =================================================================
pause
