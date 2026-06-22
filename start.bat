@echo off
chcp 936 >nul
title PRD Agent - Server + Web

echo ============================================
echo   PRD Agent Startup Script
echo   LAN Access Enabled
echo ============================================
echo.

:: Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set LOCAL_IP=%%a
    goto :got_ip
)
:got_ip
set LOCAL_IP=%LOCAL_IP: =%

echo Local IP: %LOCAL_IP%
echo.

:: Change to project root
cd /d "%~dp0"

:: Start Server
echo [1/2] Starting Server (port 3000)...
cd server
start "PRD Server" cmd /k "npm run dev"
cd ..

:: Wait for Server
timeout /t 3 /nobreak >nul

:: Start Web (LAN mode)
echo [2/2] Starting Web (port 5173, LAN mode)...
cd web
start "PRD Web" cmd /k "npm run dev -- --host"
cd ..

echo.
echo ============================================
echo   Started!
echo ============================================
echo.
echo   Local access:
echo     Web:  http://localhost:5173
echo     API:  http://localhost:3000
echo.
echo   LAN access:
echo     Web:  http://%LOCAL_IP%:5173
echo     API:  http://%LOCAL_IP%:3000
echo.
echo ============================================
echo.
echo Press any key to close (Server and Web keep running)
pause >nul