@echo off
echo ========================================
echo   BPM Metronome App - Simple Build
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Creating simple distribution...
if exist "dist-simple" (
    rmdir /s /q "dist-simple"
)

mkdir "dist-simple"
mkdir "dist-simple\BPM-Metronome-App"

echo.
echo [3/4] Copying application files...
copy "index.html" "dist-simple\BPM-Metronome-App\"
copy "app-v4.js" "dist-simple\BPM-Metronome-App\"
copy "styles-v4.css" "dist-simple\BPM-Metronome-App\"
copy "main.js" "dist-simple\BPM-Metronome-App\"
copy "package.json" "dist-simple\BPM-Metronome-App\"

xcopy "ambiences" "dist-simple\BPM-Metronome-App\ambiences\" /E /I /Q
xcopy "metronomes" "dist-simple\BPM-Metronome-App\metronomes\" /E /I /Q

echo.
echo [4/4] Creating startup script...
echo @echo off > "dist-simple\BPM-Metronome-App\START-APP.bat"
echo echo Starting BPM Metronome App... >> "dist-simple\BPM-Metronome-App\START-APP.bat"
echo npm start >> "dist-simple\BPM-Metronome-App\START-APP.bat"
echo pause >> "dist-simple\BPM-Metronome-App\START-APP.bat"

echo.
echo ========================================
echo   Simple Build Completed! ✅
echo ========================================
echo.
echo The application is ready in: dist-simple\BPM-Metronome-App\
echo.
echo To distribute:
echo 1. Zip the entire 'BPM-Metronome-App' folder
echo 2. Send the zip file to users
echo 3. Users extract and run 'START-APP.bat'
echo.
echo Requirements for users:
echo - Node.js installed (https://nodejs.org/)
echo - Run 'npm install' in the folder
echo - Run 'START-APP.bat' to launch
echo.

echo Opening distribution folder...
start "dist-simple\BPM-Metronome-App"

echo.
echo Build process completed!
pause
