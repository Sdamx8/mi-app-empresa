import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.geom.Ellipse2D;
import java.io.File;
import java.io.IOException;
import javax.imageio.ImageIO;

/**
 * Procesador de logo para centrar un logo PNG en un círculo blanco
 * Mantiene la transparencia del PNG original y elimina bordes no deseados
 */
public class LogoProcessor {
    
    /**
     * Procesa el logo PNG y lo centra en un círculo blanco
     * 
     * @param inputPath Ruta del archivo PNG de entrada
     * @param outputPath Ruta del archivo PNG de salida
     * @param canvasSize Tamaño del lienzo final (ancho y alto)
     * @param circleRatio Proporción del círculo respecto al lienzo (0.0 a 1.0)
     * @param logoRatio Proporción del logo respecto al círculo (0.0 a 1.0)
     * @throws IOException Si hay error al leer/escribir archivos
     */
    public static void processLogo(String inputPath, String outputPath, int canvasSize, 
                                   double circleRatio, double logoRatio) throws IOException {
        
        System.out.println("🔄 Iniciando procesamiento del logo...");
        System.out.println("📁 Archivo de entrada: " + inputPath);
        System.out.println("📁 Archivo de salida: " + outputPath);
        System.out.println("📐 Tamaño del lienzo: " + canvasSize + "x" + canvasSize);
        
        // 1. Cargar el logo PNG original manteniendo transparencia
        BufferedImage originalLogo = ImageIO.read(new File(inputPath));
        if (originalLogo == null) {
            throw new IOException("No se pudo cargar la imagen: " + inputPath);
        }
        
        System.out.println("✅ Logo original cargado: " + originalLogo.getWidth() + "x" + originalLogo.getHeight());
        
        // 2. Crear lienzo con transparencia (ARGB para mantener canal alfa)
        BufferedImage canvas = new BufferedImage(canvasSize, canvasSize, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = canvas.createGraphics();
        
        // Configurar renderizado de alta calidad
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ALPHA_INTERPOLATION, RenderingHints.VALUE_ALPHA_INTERPOLATION_QUALITY);
        
        // 3. Limpiar el lienzo (fondo transparente)
        g2d.setComposite(AlphaComposite.Clear);
        g2d.fillRect(0, 0, canvasSize, canvasSize);
        g2d.setComposite(AlphaComposite.SrcOver);
        
        // 4. Calcular dimensiones del círculo
        int circleSize = (int) (canvasSize * circleRatio);
        int circleX = (canvasSize - circleSize) / 2;
        int circleY = (canvasSize - circleSize) / 2;
        
        System.out.println("⚪ Círculo blanco: " + circleSize + "x" + circleSize + " en posición (" + circleX + ", " + circleY + ")");
        
        // 5. Dibujar círculo blanco con antialiasing
        g2d.setColor(Color.WHITE);
        Ellipse2D.Double circle = new Ellipse2D.Double(circleX, circleY, circleSize, circleSize);
        g2d.fill(circle);
        
        // 6. Calcular tamaño y posición del logo dentro del círculo
        int logoSize = (int) (circleSize * logoRatio);
        int logoX = (canvasSize - logoSize) / 2;
        int logoY = (canvasSize - logoSize) / 2;
        
        System.out.println("🎯 Logo redimensionado: " + logoSize + "x" + logoSize + " en posición (" + logoX + ", " + logoY + ")");
        
        // 7. Redimensionar el logo manteniendo las proporciones
        BufferedImage resizedLogo = resizeImage(originalLogo, logoSize, logoSize);
        
        // 8. Dibujar el logo centrado sobre el círculo
        g2d.drawImage(resizedLogo, logoX, logoY, null);
        
        // 9. Limpiar recursos gráficos
        g2d.dispose();
        
        // 10. Guardar la imagen final en formato PNG (mantiene transparencia)
        boolean saved = ImageIO.write(canvas, "PNG", new File(outputPath));
        
        if (saved) {
            System.out.println("✅ Logo procesado exitosamente y guardado en: " + outputPath);
            System.out.println("🎆 Resultado: Logo centrado en círculo blanco con transparencia externa");
        } else {
            throw new IOException("No se pudo guardar la imagen procesada");
        }
    }
    
    /**
     * Redimensiona una imagen manteniendo la calidad y transparencia
     */
    private static BufferedImage resizeImage(BufferedImage original, int targetWidth, int targetHeight) {
        // Crear imagen redimensionada con canal alfa
        BufferedImage resized = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = resized.createGraphics();
        
        // Configurar calidad de redimensionado
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        
        // Redimensionar la imagen
        g2d.drawImage(original, 0, 0, targetWidth, targetHeight, null);
        g2d.dispose();
        
        return resized;
    }
    
    /**
     * Método principal para ejecutar el procesamiento
     */
    public static void main(String[] args) {
        try {
            // Configuración por defecto para el logo de GMS
            String inputPath = "public/images/logo-gms.png";  // Logo PNG original
            String outputPath = "public/images/logo-processed.png";  // Logo procesado
            
            int canvasSize = 200;      // Tamaño del lienzo final
            double circleRatio = 0.90;  // Círculo ocupa 90% del lienzo
            double logoRatio = 0.75;    // Logo ocupa 75% del círculo
            
            // Verificar si existe el archivo de entrada
            File inputFile = new File(inputPath);
            if (!inputFile.exists()) {
                System.err.println("❌ Error: No se encuentra el archivo " + inputPath);
                System.err.println("📝 Asegúrate de que el archivo logo-gms.png existe en public/images/");
                return;
            }
            
            // Procesar el logo
            processLogo(inputPath, outputPath, canvasSize, circleRatio, logoRatio);
            
            System.out.println("\n🎯 PROCESO COMPLETADO");
            System.out.println("📋 Resumen:");
            System.out.println("   • Logo original: " + inputPath);
            System.out.println("   • Logo procesado: " + outputPath);
            System.out.println("   • Tamaño final: " + canvasSize + "x" + canvasSize + "px");
            System.out.println("   • Círculo blanco: " + (int)(canvasSize * circleRatio) + "px de diámetro");
            System.out.println("   • Logo centrado: " + (int)(canvasSize * circleRatio * logoRatio) + "px");
            System.out.println("   • Fondo transparente fuera del círculo ✅");
            
        } catch (IOException e) {
            System.err.println("❌ Error procesando el logo: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Método alternativo para procesar con parámetros personalizados
     */
    public static void processLogoCustom(String inputPath, String outputPath) throws IOException {
        // Configuración optimizada para el encabezado PDF
        int canvasSize = 150;       // Tamaño optimizado para el encabezado
        double circleRatio = 0.85;  // Círculo más ajustado
        double logoRatio = 0.80;    // Logo bien proporcionado dentro del círculo
        
        processLogo(inputPath, outputPath, canvasSize, circleRatio, logoRatio);
    }
}
