@echo off
chcp 65001 >nul
title GMS - Configuración CORS Firebase Storage

echo.
echo 🚀 GLOBAL MOBILITY SOLUTIONS - CONFIGURACIÓN CORS
echo ================================================
echo 📋 Aplicando configuración CORS para informes técnicos
echo 🎯 Bucket: global-flow-db.firebasestorage.app
echo.

REM Verificar si gsutil está instalado
gsutil version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ [ERROR] Google Cloud SDK no está instalado
    echo.
    echo 📥 INSTRUCCIONES DE INSTALACIÓN:
    echo    1. Descargar desde: https://cloud.google.com/sdk/docs/install
    echo    2. Ejecutar el instalador
    echo    3. Reiniciar esta terminal
    echo    4. Ejecutar: gcloud auth login
    echo    5. Volver a ejecutar este script
    echo.
    pause
    exit /b 1
)

echo 🔐 [GMS] Verificando autenticación con Google Cloud...
gcloud auth list --filter=status:ACTIVE --format="value(account)" | findstr "@" >nul
if %errorlevel% neq 0 (
    echo ⚠️ [ATENCIÓN] No hay usuario autenticado
    echo 🔑 Iniciando proceso de autenticación...
    gcloud auth login
)

echo 🎯 [GMS] Configurando proyecto Firebase...
gcloud config set project global-flow-db

echo 🔄 [GMS] Aplicando reglas CORS para eliminar errores en informes técnicos...
gsutil cors set cors.json gs://global-flow-db.firebasestorage.app

if %errorlevel% equ 0 (
    echo.
    echo ✅ [GMS] Verificando configuración CORS aplicada...
    gsutil cors get gs://global-flow-db.firebasestorage.app
    
    echo.
    echo 🎉 ¡CONFIGURACIÓN CORS APLICADA EXITOSAMENTE!
    echo ================================================
    echo 📋 Los informes técnicos ahora cargarán imágenes sin errores CORS
    echo 🏢 Global Mobility Solutions - Cumplimiento normativo ISO asegurado
    echo.
    echo 🧪 PARA VERIFICAR QUE FUNCIONA:
    echo    1. Ir al módulo 'Informes Técnicos'
    echo    2. Crear un informe con imágenes
    echo    3. Exportar a PDF
    echo    4. Verificar que las imágenes se cargan correctamente
    echo.
) else (
    echo.
    echo ❌ [ERROR] No se pudo aplicar la configuración CORS
    echo 💡 Verificar que tienes permisos de administrador en el proyecto Firebase
    echo.
)

pause
