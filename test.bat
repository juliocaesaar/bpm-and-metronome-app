@echo off
echo ========================================
echo   BPM Metronome App - Test Script
echo ========================================
echo.

echo Testing if all required files exist...

set "missing_files="

if not exist "index.html" (
    echo ❌ index.html not found
    set "missing_files=1"
) else (
    echo ✅ index.html found
)

if not exist "app-v4.js" (
    echo ❌ app-v4.js not found
    set "missing_files=1"
) else (
    echo ✅ app-v4.js found
)

if not exist "styles-v4.css" (
    echo ❌ styles-v4.css not found
    set "missing_files=1"
) else (
    echo ✅ styles-v4.css found
)

if not exist "main.js" (
    echo ❌ main.js not found
    set "missing_files=1"
) else (
    echo ✅ main.js found
)

if not exist "package.json" (
    echo ❌ package.json not found
    set "missing_files=1"
) else (
    echo ✅ package.json found
)

if not exist "ambiences" (
    echo ❌ ambiences folder not found
    set "missing_files=1"
) else (
    echo ✅ ambiences folder found
)

if not exist "metronomes" (
    echo ❌ metronomes folder not found
    set "missing_files=1"
) else (
    echo ✅ metronomes folder found
)

echo.

if "%missing_files%"=="1" (
    echo ❌ Some required files are missing!
    echo Please make sure all files are in the correct location.
    echo.
    pause
    exit /b 1
) else (
    echo ✅ All required files found!
    echo.
    echo Testing Node.js installation...
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Node.js not found!
        echo Please install Node.js from https://nodejs.org/
        echo.
        pause
        exit /b 1
    ) else (
        echo ✅ Node.js is installed
        node --version
    )
    
    echo.
    echo Testing npm installation...
    npm --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ npm not found!
        echo Please install Node.js (npm comes with it)
        echo.
        pause
        exit /b 1
    ) else (
        echo ✅ npm is installed
        npm --version
    )
    
    echo.
    echo ========================================
    echo   All tests passed! ✅
    echo ========================================
    echo.
    echo You can now:
    echo 1. Run 'install.bat' to install dependencies
    echo 2. Run 'npm start' to test the app
    echo 3. Run 'build.bat' to create executable
    echo.
)

pause
