@echo off
:: start-wsl.bat - Launches the DW app via WSL
:: Double-click this on Windows to start dev servers in WSL

echo Starting DW app in WSL...
echo.

:: Run the start.sh script in WSL, converting Windows path to WSL path
wsl bash -c "cd \"$(wslpath '%~dp0')\" && ./start.sh"
