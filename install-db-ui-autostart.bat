@echo off
setlocal
title Futane Agro - Configure Always-On Database UI (Port 5433)
cls
echo =================================================================
echo   FUTANE AGRO ERP — ALWAYS-ON DATABASE UI CONFIGURATION
echo   Target URL: http://localhost:5433
echo =================================================================
echo.
echo Setting up automatic startup for Database UI on Windows login...

set "SCRIPT_PATH=%~dp0scripts\start-db-ui-silent.vbs"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\Futane-Agro-Database-UI.lnk"

powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$s = $ws.CreateShortcut('%SHORTCUT_PATH%'); " ^
  "$s.TargetPath = 'wscript.exe'; " ^
  "$s.Arguments = '\"%SCRIPT_PATH%\"'; " ^
  "$s.WorkingDirectory = '%~dp0'; " ^
  "$s.Description = 'Futane Agro ERP - Always-On Database UI (Port 5433)'; " ^
  "$s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo [SUCCESS] Always-On configuration installed!
    echo Shortcut added to: %SHORTCUT_PATH%
    echo.
    echo The Database UI will now ALWAYS start and open http://localhost:5433
    echo automatically whenever Windows starts.
) else (
    echo [ERROR] Failed to install startup shortcut.
)

echo.
echo Launching http://localhost:5433 now...
wscript "%SCRIPT_PATH%"
echo.
echo Done! You can close this window.
timeout /t 4 >nul
exit /b 0
