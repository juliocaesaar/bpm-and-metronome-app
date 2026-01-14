@echo off
echo ========================================
echo   BPM Metronome App - Build Script
echo ========================================
echo.

echo [1/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Attempting Electron build...
call npm run build-win
if %errorlevel% neq 0 (
    echo.
    echo ❌ Electron build failed (likely due to permissions)
    echo.
    echo [3/5] Trying alternative: Portable build...
    call build-portable.bat
    if %errorlevel% neq 0 (
        echo.
        echo ❌ Portable build also failed
        echo.
        echo [4/5] Creating offline web version instead...
        call build-offline.bat
        if %errorlevel% neq 0 (
            echo.
            echo ❌ All build methods failed
            echo.
            echo SOLUTIONS:
            echo 1. Run this script as Administrator
            echo 2. Try: build-offline.bat (web version)
            echo 3. Try: build-simple.bat (Node.js version)
            echo.
            pause
            exit /b 1
        ) else (
            echo.
            echo ✅ Offline web version created successfully!
            echo Check the 'dist-offline' folder.
            goto :end
        )
    ) else (
        echo.
        echo ✅ Portable build completed successfully!
        echo Check the 'dist' folder.
        goto :end
    )
) else (
    echo.
    echo ✅ Electron build completed successfully!
    echo Check the 'dist' folder.
    goto :end
)

:end
echo.
echo [5/5] Build process completed!
echo.
echo Available distribution methods:
echo - dist/ (Electron executable)
echo - dist-offline/ (Web offline version)
echo - dist-simple/ (Node.js version)
echo.
pause
