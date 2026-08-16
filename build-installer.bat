@echo off
setlocal
title Building Overtone .exe Installer
echo ========================================================
echo   Overtone Music Player - Windows Installer Builder
echo ========================================================
echo.

node scripts/build-installer.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Build failed with error code %ERRORLEVEL%.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Build process finished!
pause
