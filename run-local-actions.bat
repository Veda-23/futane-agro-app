@echo off
set "PATH=C:\Users\Vedant\AppData\Local\Programs\DockerDesktop\resources\bin;%PATH%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-local-actions.ps1" %*
