@echo off
setlocal
title CJ2R QA Dashboard
cd /d "%~dp0\..\.."

where node.exe >nul 2>&1
if errorlevel 1 (
    echo.
    echo CJ2R QA Dashboard could not start because Node.js was not found.
    echo Install Node.js, then double-click this file again.
    echo.
    pause
    exit /b 1
)

node.exe "tools\qa\run-translator-qa-dashboard.js"
if errorlevel 1 (
    echo.
    echo The CJ2R QA Dashboard closed because an error occurred.
    echo Review the message above, then press any key to close this window.
    pause >nul
)

endlocal
