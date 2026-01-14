@echo off
echo ========================================
echo   BPM Metronome App - Portable Build
echo ========================================
echo.

echo [1/5] Cleaning previous builds...
if exist "dist" (
    rmdir /s /q "dist"
    echo ✅ Previous build cleaned
)

echo.
echo [2/5] Clearing electron-builder cache...
if exist "%LOCALAPPDATA%\electron-builder\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache"
    echo ✅ Cache cleared
)

echo.
echo [3/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [4/5] Building portable executable...
echo This may take a few minutes...
call npm run build-win
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed. Trying alternative method...
    echo.
    echo [4.1/5] Trying direct electron-builder command...
    call npx electron-builder --win --config.win.target=portable --config.forceCodeSigning=false
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Alternative build also failed
        echo.
        echo SOLUTIONS:
        echo 1. Run this script as Administrator
        echo 2. Disable Windows Defender temporarily
        echo 3. Try the simple version instead
        echo.
        pause
        exit /b 1
    )
)

echo.
echo [5/5] Build completed successfully!
echo.
echo The portable executable can be found in the 'dist' folder.
echo You can distribute this single .exe file to users.
echo.

if exist "dist" (
    echo Opening dist folder...
    start dist
) else (
    echo WARNING: dist folder not found
)

echo.
echo Build process completed!
pause
