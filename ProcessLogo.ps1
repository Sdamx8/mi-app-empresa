# Script PowerShell para procesar logo PNG y centrarlo en círculo blanco
# Utiliza System.Drawing de .NET Framework

param(
    [string]$InputPath = "public\images\logo-gms.png",
    [string]$OutputPath = "public\images\logo-processed.png",
    [int]$CanvasSize = 200,
    [double]$CircleRatio = 0.90,
    [double]$LogoRatio = 0.75
)

Write-Host "🔄 Iniciando procesamiento del logo..." -ForegroundColor Cyan
Write-Host "📁 Archivo de entrada: $InputPath" -ForegroundColor Gray
Write-Host "📁 Archivo de salida: $OutputPath" -ForegroundColor Gray
Write-Host "📐 Tamaño del lienzo: ${CanvasSize}x${CanvasSize}" -ForegroundColor Gray

try {
    # Cargar assemblies de .NET para trabajar con imágenes
    Add-Type -AssemblyName System.Drawing
    Add-Type -AssemblyName System.Windows.Forms

    # Verificar si existe el archivo de entrada
    if (-not (Test-Path $InputPath)) {
        Write-Error "❌ Error: No se encuentra el archivo $InputPath"
        Write-Host "📝 Asegúrate de que el archivo logo-gms.png existe en public/images/" -ForegroundColor Yellow
        exit 1
    }

    # 1. Cargar el logo PNG original
    $originalLogo = [System.Drawing.Image]::FromFile((Resolve-Path $InputPath).Path)
    Write-Host "✅ Logo original cargado: $($originalLogo.Width)x$($originalLogo.Height)" -ForegroundColor Green

    # 2. Crear lienzo con transparencia
    $canvas = New-Object System.Drawing.Bitmap($CanvasSize, $CanvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)

    # 3. Configurar renderizado de alta calidad
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBilinear
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # 4. Limpiar el lienzo (fondo transparente)
    $graphics.Clear([System.Drawing.Color]::Transparent)

    # 5. Calcular dimensiones del círculo
    $circleSize = [int]($CanvasSize * $CircleRatio)
    $circleX = ($CanvasSize - $circleSize) / 2
    $circleY = ($CanvasSize - $circleSize) / 2

    Write-Host "⚪ Círculo blanco: ${circleSize}x${circleSize} en posición ($circleX, $circleY)" -ForegroundColor White

    # 6. Dibujar círculo blanco
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $graphics.FillEllipse($whiteBrush, $circleX, $circleY, $circleSize, $circleSize)

    # 7. Calcular tamaño y posición del logo
    $logoSize = [int]($circleSize * $LogoRatio)
    $logoX = ($CanvasSize - $logoSize) / 2
    $logoY = ($CanvasSize - $logoSize) / 2

    Write-Host "🎯 Logo redimensionado: ${logoSize}x${logoSize} en posición ($logoX, $logoY)" -ForegroundColor Magenta

    # 8. Dibujar el logo centrado sobre el círculo
    $logoRect = New-Object System.Drawing.Rectangle($logoX, $logoY, $logoSize, $logoSize)
    $graphics.DrawImage($originalLogo, $logoRect)

    # 9. Limpiar recursos gráficos
    $graphics.Dispose()
    $whiteBrush.Dispose()
    $originalLogo.Dispose()

    # 10. Guardar la imagen final en formato PNG
    $canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Dispose()

    Write-Host "✅ Logo procesado exitosamente y guardado en: $OutputPath" -ForegroundColor Green
    Write-Host "🎆 Resultado: Logo centrado en círculo blanco con transparencia externa" -ForegroundColor Cyan

    Write-Host "`n🎯 PROCESO COMPLETADO" -ForegroundColor Yellow
    Write-Host "📋 Resumen:" -ForegroundColor Gray
    Write-Host "   • Logo original: $InputPath" -ForegroundColor Gray
    Write-Host "   • Logo procesado: $OutputPath" -ForegroundColor Gray
    Write-Host "   • Tamaño final: ${CanvasSize}x${CanvasSize}px" -ForegroundColor Gray
    Write-Host "   • Círculo blanco: $([int]($CanvasSize * $CircleRatio))px de diámetro" -ForegroundColor Gray
    Write-Host "   • Logo centrado: $([int]($CanvasSize * $CircleRatio * $LogoRatio))px" -ForegroundColor Gray
    Write-Host "   • Fondo transparente fuera del círculo ✅" -ForegroundColor Green

} catch {
    Write-Error "❌ Error procesando el logo: $($_.Exception.Message)"
    Write-Host $_.Exception.StackTrace -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Ahora puedes usar el logo procesado en tu aplicación PDF" -ForegroundColor Green
Write-Host "📝 Actualiza la ruta del logo en el código JavaScript a: logo-processed.png" -ForegroundColor Yellow
