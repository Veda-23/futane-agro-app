@echo off
setlocal
title Futane Agro PostgreSQL Database UI (Port 5433)
echo =================================================================
echo   Futane Agro PostgreSQL Database Studio (Port 5433)
echo =================================================================

:: Check if port 5433 is already listening
powershell -NoProfile -Command ^
  "$t = Test-NetConnection -Port 5433 -ComputerName 127.0.0.1 -WarningAction SilentlyContinue; " ^
  "if ($t.TcpTestSucceeded) { exit 0 } else { exit 1 }"

if %errorlevel% equ 0 (
    echo [INFO] Database UI server is already active and listening on port 5433.
) else (
    echo [INFO] Starting Database UI server in background...
    start "" /B node scripts\postgres-ui-server.mjs
    ping 127.0.0.1 -n 3 >nul
)

echo [LAUNCHING] Opening http://localhost:5433 in default browser...
start http://localhost:5433
echo [READY] Database UI is live at http://localhost:5433
ping 127.0.0.1 -n 2 >nul
exit /b 0
