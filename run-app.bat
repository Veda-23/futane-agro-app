@echo off
title Futane Agro ERP - Lightweight UAT Runner (8GB RAM Optimized)
echo =================================================================
echo   FUTANE AGRO ERP - STARTING UAT APPLICATION
echo   Optimized for 8GB laptop RAM performance.
echo =================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-lightweight-uat.ps1"
pause
