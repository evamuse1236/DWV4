@echo off
:: start.bat - Launches the DW app (Vite + Convex) in WSL
:: Run this from Windows to start both dev servers

echo Starting DW app...
echo.

:: Get the WSL path from Windows path
:: This bat file should be in the project root

:: Start Convex dev server in one terminal
start "Convex Dev" wsl -e bash -c "cd ~/WProjects/DW && npx convex dev"

:: Wait a moment for Convex to initialize
timeout /t 3 /nobreak > nul

:: Start Vite dev server in another terminal
start "Vite Dev" wsl -e bash -c "cd ~/WProjects/DW && npm run dev"

echo.
echo Both servers starting in separate windows:
echo   - Convex dev server (backend)
echo   - Vite dev server (frontend at http://localhost:5173)
echo.
echo Close both terminal windows to stop the servers.
