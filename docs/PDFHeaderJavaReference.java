package com.gms.services;

import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.property.TextAlignment;
import com.itextpdf.layout.property.UnitValue;
import com.itextpdf.layout.property.VerticalAlignment;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;

import java.io.FileNotFoundException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * REFERENCIA JAVA: Generador de PDF de Informe Técnico con iTextPDF
 * Implementa el ENCABEZADO EXACTAMENTE como en la segunda imagen de referencia
 * 
 * NOTA: Este es código de REFERENCIA. El proyecto actual usa JavaScript con pdfMake
 * Este código muestra cómo implementar el mismo diseño en Java si fuera necesario
 * 
 * @author Sistema GMS
 * @version 3.0 - 2025-08-21
 */
public class PDFHeaderJavaReference {
    
    // Colores corporativos
    private static final Color AZUL_CORPORATIVO = new DeviceRgb(13, 71, 161); // #0d47a1
    private static final Color BLANCO = new DeviceRgb(255, 255, 255);
    
    // Fuentes
    private PdfFont fontRegular;
    private PdfFont fontBold;
    
    public PDFHeaderJavaReference() throws Exception {
        // Inicializar fuentes
        this.fontRegular = PdfFontFactory.createFont();
        this.fontBold = PdfFontFactory.createFont();
    }
    
    /**
     * Crear encabezado corporativo EXACTAMENTE como en la segunda imagen
     * Logo alineado a la izquierda, información corporativa centrada a la derecha
     * 
     * @param document Documento PDF
     * @param logoPath Ruta al logo corporativo (opcional)
     */
    public void crearEncabezadoCorporativo(Document document, String logoPath) {
        try {
            // Crear tabla para el encabezado (2 columnas)
            Table encabezadoTable = new Table(new float[]{140, 400}); // Logo: 140pt, Info: 400pt
            encabezadoTable.setWidth(UnitValue.createPercentValue(100));
            
            // === COLUMNA IZQUIERDA: LOGO ===
            Cell logoCell = new Cell();
            logoCell.setBackgroundColor(AZUL_CORPORATIVO);
            logoCell.setPadding(15);
            logoCell.setVerticalAlignment(VerticalAlignment.MIDDLE);
            
            if (logoPath != null && !logoPath.isEmpty()) {
                try {
                    Image logo = new Image(ImageDataFactory.create(logoPath));
                    logo.setWidth(120);
                    logo.setHeight(80);
                    logoCell.add(logo);
                } catch (Exception e) {
                    // Si no se puede cargar el logo, dejar celda vacía
                    logoCell.add(new Paragraph(""));
                }
            } else {
                logoCell.add(new Paragraph(""));
            }
            
            // === COLUMNA DERECHA: INFORMACIÓN CORPORATIVA ===
            Cell infoCell = new Cell();
            infoCell.setBackgroundColor(AZUL_CORPORATIVO);
            infoCell.setPadding(20);
            infoCell.setVerticalAlignment(VerticalAlignment.MIDDLE);
            
            // Nombre de la empresa (más grande y prominente)
            Paragraph nombreEmpresa = new Paragraph("GLOBAL MOBILITY SOLUTIONS GMS SAS")
                .setFont(fontBold)
                .setFontSize(18)
                .setFontColor(BLANCO)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(4);
            
            // Subtítulo del documento
            Paragraph subtitulo = new Paragraph("INFORME TÉCNICO DE SERVICIOS")
                .setFont(fontBold)
                .setFontSize(14)
                .setFontColor(BLANCO)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(8);
            
            // Información de contacto (3 líneas centradas)
            Paragraph direccion = new Paragraph("Calle 65 Sur No 79C 27 Bogotá – Bosa Centro")
                .setFont(fontRegular)
                .setFontSize(10)
                .setFontColor(BLANCO)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(1);
            
            Paragraph nitTel = new Paragraph("NIT: 901876981-4 | Tel: (+57) 3114861431")
                .setFont(fontRegular)
                .setFontSize(10)
                .setFontColor(BLANCO)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(1);
            
            Paragraph email = new Paragraph("Email: globalmobilitysolutions8@gmail.com")
                .setFont(fontRegular)
                .setFontSize(10)
                .setFontColor(BLANCO)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(10);
            
            // Agregar todos los elementos a la celda de información
            infoCell.add(nombreEmpresa);
            infoCell.add(subtitulo);
            infoCell.add(direccion);
            infoCell.add(nitTel);
            infoCell.add(email);
            
            // Agregar celdas a la tabla
            encabezadoTable.addCell(logoCell);
            encabezadoTable.addCell(infoCell);
            
            // Agregar tabla al documento
            document.add(encabezadoTable);
            
            // Línea separadora blanca (simulada con espacio)
            Paragraph separador = new Paragraph(" ")
                .setMarginTop(0)
                .setMarginBottom(20);
            document.add(separador);
            
        } catch (Exception e) {
            System.err.println("Error creando encabezado: " + e.getMessage());
        }
    }
    
    /**
     * Crear sección de información del informe (sin duplicar información)
     */
    public void crearSeccionInformacion(Document document, InformeData informe, String empleadoActual) {
        try {
            // Título de sección
            Paragraph titulo = new Paragraph("INFORMACIÓN DEL INFORME")
                .setFont(fontBold)
                .setFontSize(13)
                .setFontColor(new DeviceRgb(0, 86, 166)) // #0056A6
                .setMarginTop(15)
                .setMarginBottom(8);
            document.add(titulo);
            
            // Crear tabla para información principal
            Table infoTable = new Table(2);
            infoTable.setWidth(UnitValue.createPercentValue(100));
            
            // Fecha actual en español
            SimpleDateFormat sdf = new SimpleDateFormat("EEEE, dd 'de' MMMM 'de' yyyy", new Locale("es", "CO"));
            String fechaElaboracion = sdf.format(new Date());
            
            // Columna izquierda
            Cell izquierda = new Cell();
            izquierda.add(createFieldLabel("ID Informe:"));
            izquierda.add(createFieldValue(informe.getIdInforme()));
            izquierda.add(createFieldLabel("Fecha de elaboración:"));
            izquierda.add(createFieldValue(fechaElaboracion));
            izquierda.add(createFieldLabel("Elaborado por:"));
            izquierda.add(createFieldValue(empleadoActual));
            
            // Columna derecha (espaciado)
            Cell derecha = new Cell();
            for (int i = 0; i < 6; i++) {
                derecha.add(new Paragraph(" ").setMarginBottom(5));
            }
            
            infoTable.addCell(izquierda);
            infoTable.addCell(derecha);
            document.add(infoTable);
            
        } catch (Exception e) {
            System.err.println("Error creando sección información: " + e.getMessage());
        }
    }
    
    /**
     * Crear sección DATOS DE LA REMISIÓN (información de la remisión consolidada)
     */
    public void crearSeccionRemision(Document document, InformeData informe) {
        try {
            // Título de sección
            Paragraph titulo = new Paragraph("DATOS DE LA REMISIÓN")
                .setFont(fontBold)
                .setFontSize(13)
                .setFontColor(new DeviceRgb(0, 86, 166))
                .setMarginTop(15)
                .setMarginBottom(8);
            document.add(titulo);
            
            // Crear tabla para datos de remisión
            Table remisionTable = new Table(2);
            remisionTable.setWidth(UnitValue.createPercentValue(100));
            
            // Columna izquierda
            Cell izquierda = new Cell();
            izquierda.add(createFieldLabel("Número de Remisión:"));
            izquierda.add(createFieldValue(informe.getRemision()));
            izquierda.add(createFieldLabel("Número del Móvil:"));
            izquierda.add(createFieldValue(informe.getMovil()));
            izquierda.add(createFieldLabel("Título del trabajo:"));
            izquierda.add(createFieldValue(informe.getTituloTrabajo()));
            izquierda.add(createFieldLabel("Técnico Asignado:"));
            izquierda.add(createFieldValue(informe.getTecnico()));
            
            // Columna derecha
            Cell derecha = new Cell();
            derecha.add(createFieldLabel("Fecha de Remisión:"));
            derecha.add(createFieldValue(formatearFecha(informe.getFechaRemision())));
            derecha.add(createFieldLabel("Autorizado por:"));
            derecha.add(createFieldValue(informe.getAutorizo()));
            derecha.add(createFieldLabel("UNE:"));
            derecha.add(createFieldValue(informe.getUne()));
            // Espaciado
            derecha.add(new Paragraph(" ").setMarginBottom(5));
            derecha.add(new Paragraph(" ").setMarginBottom(5));
            
            remisionTable.addCell(izquierda);
            remisionTable.addCell(derecha);
            document.add(remisionTable);
            
        } catch (Exception e) {
            System.err.println("Error creando sección remisión: " + e.getMessage());
        }
    }
    
    // ===== MÉTODOS AUXILIARES =====
    
    private Paragraph createFieldLabel(String text) {
        return new Paragraph(text)
            .setFont(fontBold)
            .setFontSize(11)
            .setMarginBottom(2);
    }
    
    private Paragraph createFieldValue(String text) {
        return new Paragraph(text != null ? text : "No especificado")
            .setFont(fontRegular)
            .setFontSize(11)
            .setMarginBottom(5);
    }
    
    /**
     * Formatear fecha a DD/MM/YYYY (igual que en JavaScript)
     */
    private String formatearFecha(Date fecha) {
        if (fecha == null) {
            return "No especificada";
        }
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
        return sdf.format(fecha);
    }
    
    // ===== CLASE DE DATOS =====
    
    /**
     * Clase que representa los datos del informe
     * (Equivalent a los datos que vienen de JavaScript)
     */
    public static class InformeData {
        private String idInforme;
        private String remision;
        private String movil;
        private String tituloTrabajo;
        private String tecnico;
        private Date fechaRemision;
        private String autorizo;
        private String une;
        private String observacionesTecnicas;
        private Double subtotal;
        private Double total;
        
        // Constructores, getters y setters
        public InformeData() {}
        
        // Getters
        public String getIdInforme() { return idInforme; }
        public String getRemision() { return remision; }
        public String getMovil() { return movil; }
        public String getTituloTrabajo() { return tituloTrabajo; }
        public String getTecnico() { return tecnico; }
        public Date getFechaRemision() { return fechaRemision; }
        public String getAutorizo() { return autorizo; }
        public String getUne() { return une; }
        public String getObservacionesTecnicas() { return observacionesTecnicas; }
        public Double getSubtotal() { return subtotal; }
        public Double getTotal() { return total; }
        
        // Setters
        public void setIdInforme(String idInforme) { this.idInforme = idInforme; }
        public void setRemision(String remision) { this.remision = remision; }
        public void setMovil(String movil) { this.movil = movil; }
        public void setTituloTrabajo(String tituloTrabajo) { this.tituloTrabajo = tituloTrabajo; }
        public void setTecnico(String tecnico) { this.tecnico = tecnico; }
        public void setFechaRemision(Date fechaRemision) { this.fechaRemision = fechaRemision; }
        public void setAutorizo(String autorizo) { this.autorizo = autorizo; }
        public void setUne(String une) { this.une = une; }
        public void setObservacionesTecnicas(String observacionesTecnicas) { this.observacionesTecnicas = observacionesTecnicas; }
        public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }
        public void setTotal(Double total) { this.total = total; }
    }
    
    // ===== MÉTODO PRINCIPAL DE EJEMPLO =====
    
    public static void main(String[] args) {
        try {
            // Ejemplo de uso
            String dest = "informe_tecnico_ejemplo.pdf";
            PdfWriter writer = new PdfWriter(dest);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);
            
            PDFHeaderJavaReference generator = new PDFHeaderJavaReference();
            
            // Datos de ejemplo
            InformeData informe = new InformeData();
            informe.setIdInforme("GMS-IT-20250821-134512");
            informe.setRemision("1522");
            informe.setMovil("Z70-7134");
            informe.setTituloTrabajo("MANTENIMIENTO PREVENTIVO CLARABOYA 1, 2 Y 3");
            informe.setTecnico("THOMAS Y DANNY");
            informe.setFechaRemision(new Date());
            informe.setAutorizo("JOHAN GUARQUIN");
            informe.setUne("SANJOSE2");
            informe.setSubtotal(180000.0);
            informe.setTotal(214200.0);
            
            // Generar encabezado y secciones
            generator.crearEncabezadoCorporativo(document, "/path/to/logo-gms.png");
            generator.crearSeccionInformacion(document, informe, "Sergio Dabian Ayala Mondragón");
            generator.crearSeccionRemision(document, informe);
            
            document.close();
            System.out.println("PDF generado exitosamente: " + dest);
            
        } catch (Exception e) {
            System.err.println("Error generando PDF: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
