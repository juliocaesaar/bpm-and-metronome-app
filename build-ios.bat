@echo off
echo ========================================
echo   BPM Metronome App - iOS PWA Build
echo ========================================
echo.

echo [1/5] Creating iOS PWA distribution...
if exist "dist-ios" (
    rmdir /s /q "dist-ios"
)

mkdir "dist-ios"
mkdir "dist-ios\BPM-Metronome-iOS"

echo.
echo [2/5] Copying application files...
copy "index.html" "dist-ios\BPM-Metronome-iOS\"
copy "app-v4.js" "dist-ios\BPM-Metronome-iOS\"
copy "styles-v4.css" "dist-ios\BPM-Metronome-iOS\"
copy "manifest.json" "dist-ios\BPM-Metronome-iOS\"
copy "sw.js" "dist-ios\BPM-Metronome-iOS\"

xcopy "ambiences" "dist-ios\BPM-Metronome-iOS\ambiences\" /E /I /Q
xcopy "metronomes" "dist-ios\BPM-Metronome-iOS\metronomes\" /E /I /Q

echo.
echo [3/5] Creating icons folder...
mkdir "dist-ios\BPM-Metronome-iOS\icons"

echo.
echo [4/5] Creating iOS installation guide...
echo BPM Metronome App - iOS PWA > "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo. >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo COMO INSTALAR NO iOS: >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo. >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo 1. ABRIR NO SAFARI: >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo    - Abra o Safari no iPhone/iPad >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo    - Navegue ate o arquivo index.html >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo. >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo 2. ADICIONAR A TELA INICIAL: >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo    - Toque no botao de compartilhar (quadrado com seta) >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo    - Selecione "Adicionar a Tela Inicial" >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo    - Confirme o nome e icone >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo. >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo 3. USAR COMO APP NATIVO: >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo    - O app aparecera na tela inicial >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo    - Funciona offline apos primeiro acesso >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo    - Tem icone proprio e nome personalizado >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo. >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo FUNCIONALIDADES: >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo - Calculadora de BPM >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo - Metronome com diferentes sons >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo - Pads ambientais >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo - Repertorios para organizar musicas >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo - Importar/Exportar repertorios >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo. >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo VANTAGENS: >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo - Funciona offline (sem internet) >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo - Nao precisa instalar da App Store >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo - Funciona como app nativo >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo - Dados salvos localmente >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo - Atualizacoes automaticas >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo. >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo OBSERVACOES: >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo - So funciona no Safari (iOS) >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo - Primeiro acesso precisa de internet >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo - Apos instalado, funciona offline >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"
echo - Dados ficam salvos no dispositivo >> "dist-ios\BPM-Metronome-iOS\COMO-INSTALAR-iOS.txt"

echo.
echo [5/5] Creating server configuration...
echo # BPM Metronome App - iOS PWA Server Config > "dist-ios\BPM-Metronome-iOS\.htaccess"
echo. >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo # Enable compression >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo AddOutputFilterByType DEFLATE text/plain >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo AddOutputFilterByType DEFLATE text/html >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo AddOutputFilterByType DEFLATE text/xml >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo AddOutputFilterByType DEFLATE text/css >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo AddOutputFilterByType DEFLATE application/xml >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo AddOutputFilterByType DEFLATE application/xhtml+xml >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo AddOutputFilterByType DEFLATE application/rss+xml >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo AddOutputFilterByType DEFLATE application/javascript >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo AddOutputFilterByType DEFLATE application/x-javascript >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo. >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo # MIME types >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo AddType application/manifest+json .webmanifest >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo AddType application/manifest+json .json >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo AddType audio/wav .wav >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo. >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo # Cache control >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo ExpiresActive On >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo ExpiresByType text/css "access plus 1 month" >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo ExpiresByType application/javascript "access plus 1 month" >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo ExpiresByType image/png "access plus 1 month" >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo ExpiresByType audio/wav "access plus 1 month" >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo ExpiresByType application/manifest+json "access plus 1 week" >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo. >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo # CORS headers >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo Header always set Access-Control-Allow-Origin "*" >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS" >> "dist-ios\BPM-Metronome-iOS\.htaccess"
echo Header always set Access-Control-Allow-Headers "Content-Type" >> "dist-ios\BPM-Metronome-iOS\.htaccess"

echo.
echo ========================================
echo   iOS PWA Build Completed! ✅
echo ========================================
echo.
echo The iOS PWA is ready in: dist-ios\BPM-Metronome-iOS\
echo.
echo IMPORTANT: You need to create icons first!
echo 1. Open create-ios-icons.html in your browser
echo 2. Download all required icon sizes
echo 3. Place them in the icons/ folder
echo.
echo To distribute:
echo 1. Upload the entire folder to a web server
echo 2. Share the URL with iOS users
echo 3. Users open in Safari and "Add to Home Screen"
echo.
echo ADVANTAGES:
echo - Works like a native iOS app
echo - Functions offline after first load
echo - No App Store required
echo - Automatic updates
echo - Local data storage
echo.

echo Opening distribution folder...
start "dist-ios\BPM-Metronome-iOS"

echo.
echo Build process completed!
pause
