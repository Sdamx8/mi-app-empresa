@echo off
chcp 65001 >nul
title GMS - Instalación Google Cloud SDK

echo.
echo 🚀 GLOBAL MOBILITY SOLUTIONS - INSTALACIÓN GOOGLE CLOUD SDK
echo =============================================================
echo 📋 Necesario para resolver errores CORS en informes técnicos
echo.

echo 📥 DESCARGANDO GOOGLE CLOUD SDK...
echo.

REM Crear directorio temporal
mkdir %TEMP%\gms-setup 2>nul
cd /d %TEMP%\gms-setup

echo 🔄 Descargando instalador de Google Cloud SDK...
powershell -Command "& {Invoke-WebRequest -Uri 'https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe' -OutFile 'GoogleCloudSDKInstaller.exe'}"

if exist GoogleCloudSDKInstaller.exe (
    echo ✅ Descarga completada
    echo.
    echo 🔧 INSTALANDO GOOGLE CLOUD SDK...
    echo    - El instalador se abrirá en una nueva ventana
    echo    - Sigue las instrucciones del instalador
    echo    - Al finalizar, se abrirá una terminal para autenticación
    echo.
    
    start /wait GoogleCloudSDKInstaller.exe
    
    echo.
    echo ✅ Instalación completada
    echo.
    echo 🔐 CONFIGURANDO AUTENTICACIÓN...
    echo    1. Se abrirá tu navegador para autenticación
    echo    2. Inicia sesión con tu cuenta de Google
    echo    3. Autoriza el acceso a Google Cloud
    echo.
    
    pause
    
    gcloud auth login
    gcloud config set project global-flow-db
    
    echo.
    echo 🎯 APLICANDO CONFIGURACIÓN CORS...
    cd /d "%~dp0"
    gsutil cors set cors.json gs://global-flow-db.firebasestorage.app
    
    if %errorlevel% equ 0 (
        echo.
        echo 🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!
        echo =============================================
        echo ✅ Google Cloud SDK instalado
        echo ✅ Autenticación configurada  
        echo ✅ CORS aplicado a Firebase Storage
        echo ✅ Informes técnicos funcionarán sin errores
        echo.
        echo 🧪 PRÓXIMOS PASOS:
        echo    1. Ir al módulo 'Informes Técnicos'
        echo    2. Crear un informe con imágenes
        echo    3. Exportar a PDF
        echo    4. Verificar que las imágenes se cargan correctamente
        echo.
    ) else (
        echo.
        echo ⚠️ Hubo un problema aplicando CORS
        echo 💡 Ejecuta manualmente: aplicar-cors.bat
        echo.
    )
    
) else (
    echo ❌ Error descargando el instalador
    echo.
    echo 📋 INSTALACIÓN MANUAL:
    echo    1. Ir a: https://cloud.google.com/sdk/docs/install
    echo    2. Descargar "Google Cloud CLI installer"
    echo    3. Ejecutar el instalador
    echo    4. Reiniciar terminal
    echo    5. Ejecutar: aplicar-cors.bat
    echo.
)

echo.
pause
