@echo off
cd /d "%~dp0"
title Futane Agro ERP - Permanent Laptop Hang and RAM Fix
echo =================================================================
echo   FUTANE AGRO ERP - PERMANENT LAPTOP HANG AND RAM FIX
echo   Requesting Administrator privileges...
echo =================================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0fix-laptop-hang-permanently.ps1\"'"
