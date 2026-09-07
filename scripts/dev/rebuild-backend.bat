@echo off
echo === Rebuilding Futane Agro Backend ===
cd /d "C:\Users\Vedant\.gemini\antigravity-ide\scratch\futane-agro-app\backend"
call mvn clean package -DskipTests -q
if %errorlevel% neq 0 (
  echo BUILD FAILED. Check Maven output above.
  pause
  exit /b 1
)
echo BUILD SUCCESS.
echo.
echo Restart your Spring Boot process to pick up the new JAR.
pause
