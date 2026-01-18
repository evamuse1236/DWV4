@echo off
:: start.bat - Launches the DW app (Vite + Convex) natively on Windows
:: Run this from the project root to start both dev servers

echo Starting DW app...
echo.

:: Use the directory where this batch file is located
cd /d "%~dp0"

:: Start Convex dev server in one terminal
start "Convex Dev" cmd /k "cd /d "%~dp0" && bunx convex dev"

:: Wait a moment for Convex to initialize
timeout /t 3 /nobreak > nul

:: Start Vite dev server in another terminal
start "Vite Dev" cmd /k "cd /d "%~dp0" && bun run dev"

echo.
echo Both servers starting in separate windows:
echo   - Convex dev server (backend)
echo   - Vite dev server (frontend at http://localhost:5173)
echo.
echo Close both terminal windows to stop the servers.
