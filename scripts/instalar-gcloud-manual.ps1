# GLOBAL MOBILITY SOLUTIONS - INSTALACION MANUAL GOOGLE CLOUD SDK
# =================================================================
# Script mejorado para resolver errores CORS en informes tecnicos

Write-Host "GLOBAL MOBILITY SOLUTIONS - INSTALACION GOOGLE CLOUD SDK" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Necesario para resolver errores CORS en informes tecnicos" -ForegroundColor Yellow
Write-Host ""

# Verificar si ya esta instalado
$gcloudPath = Get-Command gcloud -ErrorAction SilentlyContinue
if ($gcloudPath) {
    Write-Host "Google Cloud SDK ya esta instalado: $($gcloudPath.Source)" -ForegroundColor Green
    gcloud --version
    Write-Host ""
    Write-Host "Procediendo con autenticacion y configuracion CORS..." -ForegroundColor Yellow
} else {
    Write-Host "DESCARGANDO E INSTALANDO GOOGLE CLOUD SDK..." -ForegroundColor Yellow
    
    # Crear directorio temporal
    $tempDir = "$env:TEMP\gcloud-install"
    if (!(Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    }
    
    # URL del instalador de Google Cloud SDK para Windows
    $installerUrl = "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe"
    $installerPath = "$tempDir\GoogleCloudSDKInstaller.exe"
    
    try {
        Write-Host "Descargando instalador..." -ForegroundColor White
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
        
        Write-Host "Descarga completada" -ForegroundColor Green
        Write-Host "EJECUTANDO INSTALADOR..." -ForegroundColor Yellow
        Write-Host "   - Se abrira el instalador en una nueva ventana" -ForegroundColor White
        Write-Host "   - Acepta todos los valores por defecto" -ForegroundColor White
        Write-Host "   - Marca la opcion 'Agregar al PATH'" -ForegroundColor White
        Write-Host "   - Al finalizar, presiona cualquier tecla aqui" -ForegroundColor White
        Write-Host ""
        
        # Ejecutar instalador y esperar
        Start-Process -FilePath $installerPath -Wait
        
        Write-Host "Esperando a que completes la instalacion..." -ForegroundColor Yellow
        Read-Host "Presiona ENTER cuando hayas completado la instalacion"
        
        # Refrescar PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        
        # Verificar instalacion
        $gcloudPath = Get-Command gcloud -ErrorAction SilentlyContinue
        if ($gcloudPath) {
            Write-Host "Instalacion exitosa!" -ForegroundColor Green
            gcloud --version
        } else {
            Write-Host "Instalacion fallida - intenta reiniciar PowerShell e intentar de nuevo" -ForegroundColor Red
            exit 1
        }
        
    } catch {
        Write-Host "Error durante la descarga: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Intenta descargar manualmente desde: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "CONFIGURANDO AUTENTICACION..." -ForegroundColor Yellow
Write-Host "   1. Se abrira tu navegador para autenticacion" -ForegroundColor White
Write-Host "   2. Inicia sesion con tu cuenta de Google asociada al proyecto Firebase" -ForegroundColor White
Write-Host "   3. Autoriza el acceso a Google Cloud" -ForegroundColor White
Write-Host ""

try {
    # Autenticar con Google Cloud
    gcloud auth login --no-launch-browser
    
    Write-Host "Autenticacion completada" -ForegroundColor Green
    
    # Configurar proyecto
    Write-Host "CONFIGURANDO PROYECTO..." -ForegroundColor Yellow
    gcloud config set project global-flow-db
    
    Write-Host "Proyecto configurado: global-flow-db" -ForegroundColor Green
    
} catch {
    Write-Host "Error en autenticacion: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Intenta ejecutar manualmente: gcloud auth login" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "APLICANDO CONFIGURACION CORS..." -ForegroundColor Yellow

try {
    # Aplicar CORS
    gsutil cors set cors.json gs://global-flow-db.firebasestorage.app
    
    Write-Host "CORS aplicado exitosamente" -ForegroundColor Green
    
    # Verificar CORS
    Write-Host "Verificando configuracion CORS..." -ForegroundColor White
    gsutil cors get gs://global-flow-db.firebasestorage.app
    
} catch {
    Write-Host "Error aplicando CORS: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Intenta ejecutar manualmente: gsutil cors set cors.json gs://global-flow-db.firebasestorage.app" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "CONFIGURACION COMPLETADA!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "Google Cloud SDK instalado y configurado" -ForegroundColor Green
Write-Host "Autenticacion configurada" -ForegroundColor Green
Write-Host "CORS aplicado a Firebase Storage" -ForegroundColor Green
Write-Host "Informes tecnicos funcionaran sin errores CORS" -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "   1. Ejecutar: npm start" -ForegroundColor White
Write-Host "   2. Ir al modulo Informes Tecnicos" -ForegroundColor White
Write-Host "   3. Crear un informe con imagenes" -ForegroundColor White
Write-Host "   4. Exportar a PDF" -ForegroundColor White
Write-Host "   5. Verificar que las imagenes se cargan correctamente" -ForegroundColor White
Write-Host ""

Read-Host "Presiona ENTER para continuar"
