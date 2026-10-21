@echo off
setlocal
title Futane Agro - Disable Always-On Database UI
cls
echo =================================================================
echo   FUTANE AGRO ERP — REMOVE ALWAYS-ON DATABASE UI
echo =================================================================
echo.
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\Futane-Agro-Database-UI.lnk"

if exist "%SHORTCUT_PATH%" (
    del "%SHORTCUT_PATH%" >nul 2>&1
    echo [SUCCESS] Removed Always-On Database UI shortcut from Windows Startup.
) else (
    echo [INFO] Shortcut was not present in Windows Startup.
)

echo.
pause
exit /b 0
