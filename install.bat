@echo off
echo ========================================
echo   BPM Metronome App - Install Script
echo ========================================
echo.

echo Installing Node.js dependencies...
echo This may take a few minutes...
echo.

call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Please make sure you have Node.js installed.
    echo Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Installation completed successfully!
echo ========================================
echo.
echo You can now:
echo 1. Run 'npm start' to test the app
echo 2. Run 'build.bat' to create executable
echo.
pause
