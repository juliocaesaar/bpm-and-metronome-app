@echo off
echo ========================================
echo   BPM Metronome App - Clean Script
echo ========================================
echo.

echo Cleaning temporary files and build artifacts...

if exist "node_modules" (
    echo Removing node_modules...
    rmdir /s /q "node_modules"
    echo ✅ node_modules removed
) else (
    echo ✅ node_modules not found (already clean)
)

if exist "dist" (
    echo Removing dist folder...
    rmdir /s /q "dist"
    echo ✅ dist folder removed
) else (
    echo ✅ dist folder not found (already clean)
)

if exist "package-lock.json" (
    echo Removing package-lock.json...
    del "package-lock.json"
    echo ✅ package-lock.json removed
) else (
    echo ✅ package-lock.json not found (already clean)
)

if exist "npm-debug.log" (
    echo Removing npm-debug.log...
    del "npm-debug.log"
    echo ✅ npm-debug.log removed
) else (
    echo ✅ npm-debug.log not found (already clean)
)

echo.
echo ========================================
echo   Clean completed! ✅
echo ========================================
echo.
echo The project is now clean and ready for:
echo 1. Fresh installation (install.bat)
echo 2. Testing (npm start)
echo 3. Building (build.bat)
echo.

pause
