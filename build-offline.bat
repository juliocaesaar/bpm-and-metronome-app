@echo off
echo ========================================
echo   BPM Metronome App - Offline Build
echo ========================================
echo.

echo [1/3] Creating offline distribution...
if exist "dist-offline" (
    rmdir /s /q "dist-offline"
)

mkdir "dist-offline"
mkdir "dist-offline\BPM-Metronome-App-Offline"

echo.
echo [2/3] Copying application files...
copy "index.html" "dist-offline\BPM-Metronome-App-Offline\"
copy "app-v4.js" "dist-offline\BPM-Metronome-App-Offline\"
copy "styles-v4.css" "dist-offline\BPM-Metronome-App-Offline\"

xcopy "ambiences" "dist-offline\BPM-Metronome-App-Offline\ambiences\" /E /I /Q
xcopy "metronomes" "dist-offline\BPM-Metronome-App-Offline\metronomes\" /E /I /Q

echo.
echo [3/3] Creating instructions file...
echo BPM Metronome App - Versao Offline > "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo. >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo COMO USAR: >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo 1. Abra o arquivo 'index.html' no seu navegador >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo 2. O aplicativo funcionara offline >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo 3. Todos os recursos estao incluidos >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo. >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo FUNCIONALIDADES: >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo - Calculadora de BPM >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo - Metronome com diferentes sons >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo - Pads ambientais >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo - Repertorios para organizar musicas >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo - Importar/Exportar repertorios >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo. >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo VANTAGENS: >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo - Funciona offline (sem internet) >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo - Nao precisa instalar nada >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo - Funciona em qualquer navegador >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"
echo - Dados salvos localmente >> "dist-offline\BPM-Metronome-App-Offline\COMO-USAR.txt"

echo.
echo ========================================
echo   Offline Build Completed! ✅
echo ========================================
echo.
echo The offline application is ready in: dist-offline\BPM-Metronome-App-Offline\
echo.
echo To distribute:
echo 1. Zip the entire 'BPM-Metronome-App-Offline' folder
echo 2. Send the zip file to users
echo 3. Users extract and open 'index.html' in their browser
echo.
echo ADVANTAGES:
echo - Works on any computer
echo - No installation required
echo - Works offline
echo - Compatible with all browsers
echo.

echo Opening distribution folder...
start "dist-offline\BPM-Metronome-App-Offline"

echo.
echo Build process completed!
pause
