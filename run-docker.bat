@echo off
setlocal
cd /d "%~dp0"
set PATH=C:\Program Files\Docker\Docker\resources\bin;C:\Program Files\Docker\Docker\resources;%PATH%
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-docker.ps1" %*
