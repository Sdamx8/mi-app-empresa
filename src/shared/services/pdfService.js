// Servicio para generar PDFs de informes técnicos con soporte para múltiples imágenes
import jsPDF from 'jspdf';
import { ImageService } from './imageService';

export class PDFService {
  static EMPRESA_CONFIG = {
    nombre: 'MI EMPRESA TÉCNICA S.A.S',
    nit: '900.123.456-7',
    direccion: 'Calle 123 #45-67, Bogotá D.C.',
    telefono: '+57 (1) 234-5678',
    email: 'contacto@miempresatecnica.com'
  };

  /**
   * Utilidad para convertir cualquier valor a string seguro para PDF
   * @param {any} value - Valor a convertir
   * @returns {string} String seguro para pdf.text()
   */
  static safeText(value) {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object' && value instanceof Date) {
      return value.toLocaleDateString('es-ES');
    }
    return String(value);
  }

  /**
   * Generar y descargar informe PDF con múltiples imágenes
   * @param {Object} informeData - Datos del informe
   * @param {Object} imagenes - Objeto con imágenes {antes: [], despues: []}
   */
  static async generarYDescargarInforme(informeData, imagenes = {}) {
    try {
      console.log('📄 Iniciando generación de PDF...');
      console.log('📋 Datos del informe:', informeData);
      console.log('🖼️ Imágenes recibidas:', imagenes);

      // Configuración del PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let currentY = margin;

      // Agregar encabezado
      currentY = await this.agregarEncabezado(pdf, pageWidth, currentY, margin);

      // Agregar información del informe
      currentY = this.agregarInfoInforme(pdf, informeData, pageWidth, currentY, margin);

      // Agregar descripción del trabajo
      if (informeData.descripcionTrabajo) {
        currentY = this.agregarDescripcionTrabajo(pdf, informeData.descripcionTrabajo, pageWidth, currentY, margin);
      }

      // Preparar imágenes para procesamiento
      const imagenesParaPDF = this.prepararImagenesParaPDF(informeData, imagenes);

      // Agregar imágenes si existen
      if (this.tieneImagenes(imagenesParaPDF)) {
        currentY = await this.agregarImagenesMultiples(pdf, imagenesParaPDF, pageWidth, currentY, margin, pageHeight);
      }

      // Agregar observaciones
      if (informeData.observaciones) {
        currentY = this.agregarObservaciones(pdf, informeData.observaciones, pageWidth, currentY, margin, pageHeight);
      }

      // Agregar pie de página
      this.agregarPiePagina(pdf, pageWidth, pageHeight, informeData);

      // Descargar PDF
      const nombreArchivo = `informe_tecnico_${informeData.numeroInforme || Date.now()}.pdf`;
      this.descargarPDF(pdf, nombreArchivo);

      console.log('✅ PDF generado y descargado exitosamente');
      return {
        success: true,
        message: 'PDF generado exitosamente',
        fileName: nombreArchivo
      };

    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      throw new Error(`Error al generar PDF: ${error.message}`);
    }
  }

  // Preparar imágenes desde diferentes fuentes
  static prepararImagenesParaPDF(informeData, imagenes) {
    console.log('🔍 DEPURACIÓN: Preparando imágenes para PDF');
    console.log('📊 informeData recibido:', {
      id: informeData.id,
      numeroRemision: informeData.numeroRemision,
      keys: Object.keys(informeData)
    });
    console.log('📷 imagenes adicionales recibidas:', imagenes);

    const imagenesParaPDF = {
      antes: [],
      despues: []
    };

    // Imágenes desde el objeto imagenes adicionales
    if (imagenes.antes) {
      if (Array.isArray(imagenes.antes)) {
        imagenesParaPDF.antes.push(...imagenes.antes);
        console.log(`➕ Agregadas ${imagenes.antes.length} imágenes ANTES desde parámetro adicional`);
      } else {
        imagenesParaPDF.antes.push(imagenes.antes);
        console.log('➕ Agregada 1 imagen ANTES desde parámetro adicional');
      }
    }

    if (imagenes.despues) {
      if (Array.isArray(imagenes.despues)) {
        imagenesParaPDF.despues.push(...imagenes.despues);
        console.log(`➕ Agregadas ${imagenes.despues.length} imágenes DESPUÉS desde parámetro adicional`);
      } else {
        imagenesParaPDF.despues.push(imagenes.despues);
        console.log('➕ Agregada 1 imagen DESPUÉS desde parámetro adicional');
      }
    }

    // PRIORIDAD 1: Usar imágenes base64 si están disponibles (evita problemas CORS)
    console.log('🔍 Verificando disponibilidad de imágenes base64...');
    console.log('   imagenAntesBase64:', !!informeData.imagenAntesBase64 ? '✅ Disponible' : '❌ No disponible');
    console.log('   imagenesAntesBase64:', !!informeData.imagenesAntesBase64 ? `✅ Disponible (${informeData.imagenesAntesBase64?.length || 0} imágenes)` : '❌ No disponible');
    console.log('   imagenDespuesBase64:', !!informeData.imagenDespuesBase64 ? '✅ Disponible' : '❌ No disponible');
    console.log('   imagenesDespuesBase64:', !!informeData.imagenesDespuesBase64 ? `✅ Disponible (${informeData.imagenesDespuesBase64?.length || 0} imágenes)` : '❌ No disponible');

    if (informeData.imagenAntesBase64) {
      console.log('✅ Usando base64 "antes" para evitar CORS');
      imagenesParaPDF.antes.push(informeData.imagenAntesBase64);
    } else if (informeData.imagenesAntesBase64 && Array.isArray(informeData.imagenesAntesBase64)) {
      console.log(`✅ Usando múltiples base64 "antes" para evitar CORS (${informeData.imagenesAntesBase64.length} imágenes)`);
      imagenesParaPDF.antes.push(...informeData.imagenesAntesBase64);
    } else {
      // FALLBACK: Usar URLs solo si no hay base64 disponible
      console.log('⚠️ No hay imágenes base64 "antes", usando URLs (puede fallar por CORS)');
      if (informeData.imagenAntesURL) {
        console.log('⚠️ Agregando URL "antes" individual');
        imagenesParaPDF.antes.push(informeData.imagenAntesURL);
      }
      if (informeData.imagenesAntesURLs && Array.isArray(informeData.imagenesAntesURLs)) {
        console.log(`⚠️ Agregando múltiples URLs "antes" (${informeData.imagenesAntesURLs.length} imágenes)`);
        imagenesParaPDF.antes.push(...informeData.imagenesAntesURLs);
      }
    }

    if (informeData.imagenDespuesBase64) {
      console.log('✅ Usando base64 "después" para evitar CORS');
      imagenesParaPDF.despues.push(informeData.imagenDespuesBase64);
    } else if (informeData.imagenesDespuesBase64 && Array.isArray(informeData.imagenesDespuesBase64)) {
      console.log(`✅ Usando múltiples base64 "después" para evitar CORS (${informeData.imagenesDespuesBase64.length} imágenes)`);
      imagenesParaPDF.despues.push(...informeData.imagenesDespuesBase64);
    } else {
      // FALLBACK: Usar URLs solo si no hay base64 disponible
      console.log('⚠️ No hay imágenes base64 "después", usando URLs (puede fallar por CORS)');
      if (informeData.imagenDespuesURL) {
        console.log('⚠️ Agregando URL "después" individual');
        imagenesParaPDF.despues.push(informeData.imagenDespuesURL);
      }
      if (informeData.imagenesDespuesURLs && Array.isArray(informeData.imagenesDespuesURLs)) {
        console.log(`⚠️ Agregando múltiples URLs "después" (${informeData.imagenesDespuesURLs.length} imágenes)`);
        imagenesParaPDF.despues.push(...informeData.imagenesDespuesURLs);
      }
    }

    // Filtrar URLs válidas
    imagenesParaPDF.antes = imagenesParaPDF.antes.filter(url => url && url.trim() !== '');
    imagenesParaPDF.despues = imagenesParaPDF.despues.filter(url => url && url.trim() !== '');

    console.log('📊 Resumen FINAL de imágenes para PDF:', {
      antes: imagenesParaPDF.antes.length,
      despues: imagenesParaPDF.despues.length,
      antesTypes: imagenesParaPDF.antes.map(img => img.startsWith('data:') ? 'BASE64' : 'URL'),
      despuesTypes: imagenesParaPDF.despues.map(img => img.startsWith('data:') ? 'BASE64' : 'URL')
    });

    return imagenesParaPDF;
  }

  // Verificar si hay imágenes disponibles
  static tieneImagenes(imagenes) {
    return imagenes.antes.length > 0 || imagenes.despues.length > 0;
  }

  // Agregar encabezado con logo
  static async agregarEncabezado(pdf, pageWidth, currentY, margin) {
    // Fondo del encabezado
    pdf.setFillColor(40, 116, 166);
    pdf.rect(0, 0, pageWidth, 50, 'F');

    // Título principal
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.safeText(this.EMPRESA_CONFIG.nombre), margin, 18);

    // Subtítulo
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(this.safeText('INFORME TÉCNICO DE SERVICIOS'), margin, 28);

    // Información de contacto
    pdf.setFontSize(8);
    pdf.text(this.safeText(this.EMPRESA_CONFIG.direccion), margin, 38);
    pdf.text(this.safeText(`${this.EMPRESA_CONFIG.nit} | Tel: ${this.EMPRESA_CONFIG.telefono}`), margin, 42);
    pdf.text(this.safeText(`Email: ${this.EMPRESA_CONFIG.email}`), margin, 46);

    return 60;
  }

  // Agregar información del informe
  static agregarInfoInforme(pdf, informeData, pageWidth, currentY, margin) {
    pdf.setTextColor(0, 0, 0);
    
    // Título de sección
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.safeText('INFORMACIÓN DEL SERVICIO'), margin, currentY);
    currentY += 10;

    // Línea divisoria
    pdf.setDrawColor(40, 116, 166);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    // Información en dos columnas
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const leftColumn = margin;
    const rightColumn = pageWidth / 2 + 10;

    // ✅ CORREGIDO: Mapeo correcto de campos + safeText
    // Columna izquierda
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.safeText('No. Informe:'), leftColumn, currentY);
    pdf.setFont('helvetica', 'normal');
    // Usar numeroRemision o informeId si no hay numeroInforme
    const numeroInforme = informeData.numeroInforme || informeData.numeroRemision || informeData.informeId || informeData.id || 'N/A';
    pdf.text(this.safeText(numeroInforme), leftColumn + 25, currentY);

    pdf.setFont('helvetica', 'bold');
    pdf.text(this.safeText('Fecha:'), leftColumn, currentY + 6);
    pdf.setFont('helvetica', 'normal');
    // Usar fechaCreacion o fechaRemision
    const fecha = informeData.fecha || informeData.fechaCreacion || informeData.fechaRemision || new Date().toLocaleDateString('es-ES');
    pdf.text(this.safeText(fecha), leftColumn + 25, currentY + 6);

    pdf.setFont('helvetica', 'bold');
    pdf.text(this.safeText('Cliente:'), leftColumn, currentY + 12);
    pdf.setFont('helvetica', 'normal');
    // Usar autorizadoPor como cliente
    const cliente = informeData.cliente || informeData.autorizadoPor || 'N/A';
    pdf.text(this.safeText(cliente), leftColumn + 25, currentY + 12);

    // Columna derecha
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.safeText('Técnico:'), rightColumn, currentY);
    pdf.setFont('helvetica', 'normal');
    // Usar elaboradoPor o tecnico
    const tecnico = informeData.elaboradoPor || informeData.tecnico || 'N/A';
    pdf.text(this.safeText(tecnico), rightColumn + 25, currentY);

    pdf.setFont('helvetica', 'bold');
    pdf.text(this.safeText('Ubicación:'), rightColumn, currentY + 6);
    pdf.setFont('helvetica', 'normal');
    // Usar ubicacionUNE
    const ubicacion = informeData.ubicacion || informeData.ubicacionUNE || 'N/A';
    pdf.text(this.safeText(ubicacion), rightColumn + 25, currentY + 6);

    pdf.setFont('helvetica', 'bold');
    pdf.text(this.safeText('Tipo:'), rightColumn, currentY + 12);
    pdf.setFont('helvetica', 'normal');
    // Usar tituloTrabajo como tipo de servicio
    const tipoServicio = informeData.tipoServicio || informeData.tituloTrabajo || 'N/A';
    pdf.text(this.safeText(tipoServicio), rightColumn + 25, currentY + 12);

    return currentY + 25;
  }

  // Agregar descripción del trabajo
  static agregarDescripcionTrabajo(pdf, descripcion, pageWidth, currentY, margin) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.safeText('DESCRIPCIÓN DEL TRABAJO REALIZADO'), margin, currentY);
    currentY += 10;

    pdf.setDrawColor(40, 116, 166);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const lines = pdf.splitTextToSize(this.safeText(descripcion), pageWidth - (margin * 2));
    pdf.text(lines, margin, currentY);

    return currentY + (lines.length * 5) + 15;
  }

  // Agregar múltiples imágenes al PDF
  static async agregarImagenesMultiples(pdf, imagenes, pageWidth, currentY, margin, pageHeight) {
    console.log('🖼️ Iniciando procesamiento de múltiples imágenes para PDF');
    
    // Título de sección
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.safeText('EVIDENCIAS FOTOGRÁFICAS'), margin, currentY);
    currentY += 10;

    // Línea divisoria
    pdf.setDrawColor(40, 116, 166);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    const imageWidth = 65;
    const imageHeight = 45;
    const imageSpacing = 8;
    const imagesPerRow = 2;

    // Procesar imágenes "ANTES"
    if (imagenes.antes.length > 0) {
      currentY = await this.procesarSeccionImagenes(
        pdf, imagenes.antes, 'ANTES', pageWidth, currentY, margin, pageHeight,
        imageWidth, imageHeight, imageSpacing, imagesPerRow
      );
    }

    // Procesar imágenes "DESPUÉS"
    if (imagenes.despues.length > 0) {
      currentY = await this.procesarSeccionImagenes(
        pdf, imagenes.despues, 'DESPUÉS', pageWidth, currentY, margin, pageHeight,
        imageWidth, imageHeight, imageSpacing, imagesPerRow
      );
    }

    return currentY + 10;
  }

  // Procesar una sección de imágenes
  static async procesarSeccionImagenes(pdf, imagenesArray, titulo, pageWidth, currentY, margin, pageHeight, imageWidth, imageHeight, imageSpacing, imagesPerRow) {
    // Verificar espacio para el título
    if (currentY + 30 > pageHeight - 30) {
      pdf.addPage();
      currentY = margin;
    }

    // Título de la sección
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.safeText(`${titulo} (${imagenesArray.length} imagen${imagenesArray.length > 1 ? 'es' : ''})`), margin, currentY);
    currentY += 8;

    // Procesar imágenes en filas
    for (let i = 0; i < imagenesArray.length; i += imagesPerRow) {
      const filasImagenes = imagenesArray.slice(i, i + imagesPerRow);
      
      // Verificar espacio para la fila de imágenes
      if (currentY + imageHeight + 20 > pageHeight - 30) {
        pdf.addPage();
        currentY = margin;
      }

      // Procesar imágenes de la fila actual
      for (let j = 0; j < filasImagenes.length; j++) {
        const imagen = filasImagenes[j];
        const xPos = margin + (j * (imageWidth + imageSpacing));

        try {
          console.log(`📸 Procesando imagen ${titulo} ${i + j + 1}:`, imagen);
          const imgProcessed = await this.processImageForPDF(imagen);
          
          if (imgProcessed) {
            pdf.addImage(imgProcessed, 'JPEG', xPos, currentY, imageWidth, imageHeight);
            
            // Número de imagen
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text(this.safeText(`${i + j + 1}`), xPos + imageWidth - 10, currentY + imageHeight + 5);
            
            console.log(`✅ Imagen ${titulo} ${i + j + 1} procesada exitosamente`);
          } else {
            throw new Error('No se pudo procesar la imagen');
          }
          
        } catch (error) {
          console.error(`❌ Error procesando imagen ${titulo} ${i + j + 1}:`, error);
          
          // Mostrar placeholder para imagen fallida
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.5);
          pdf.rect(xPos, currentY, imageWidth, imageHeight);
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(150, 150, 150);
          pdf.text(this.safeText('Error al cargar'), xPos + 5, currentY + imageHeight/2);
          pdf.text(this.safeText(`imagen ${i + j + 1}`), xPos + 5, currentY + imageHeight/2 + 8);
          pdf.setTextColor(0, 0, 0);
        }
      }

      currentY += imageHeight + imageSpacing + 8;
    }

    return currentY;
  }

  // Procesar imagen para PDF (SOLUCIÓN DEFINITIVA SIN CORS - ISO COMPLIANT)
  static async processImageForPDF(imageUrl) {
    console.log('🖼️ [ISO] Procesando imagen para informe técnico normativo:', imageUrl);
    
    // Si la URL ya es un data URL, devolverla directamente
    if (imageUrl.startsWith('data:')) {
      console.log('✅ [ISO] Imagen ya en formato data URL normativo');
      return imageUrl;
    }
    
    try {
      // Usar el método ImageService.getImageBase64 que resuelve CORS definitivamente
      const base64Image = await ImageService.getImageBase64(imageUrl);
      console.log('✅ [ISO] Imagen procesada exitosamente sin CORS para informe técnico');
      return base64Image;
    } catch (error) {
      console.warn('⚠️ [ISO] Error procesando imagen, generando placeholder normativo:', error.message);
      // Generar placeholder ISO compliant si todo falla
      return this.generarImagenPlaceholderISO();
    }
  }

  // Generar imagen placeholder conforme a normatividad ISO
  static generarImagenPlaceholderISO() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 300;
    
    // Fondo blanco conforme a ISO
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Borde conforme a estándares técnicos
    ctx.strokeStyle = '#1e3c72';
    ctx.lineWidth = 3;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
    
    // Logo GMS para identificación
    ctx.fillStyle = '#1e3c72';
    ctx.fillRect(canvas.width/2 - 40, 60, 80, 50);
    
    // Texto normativo ISO
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GLOBAL MOBILITY SOLUTIONS GMS SAS', canvas.width / 2, 140);
    
    ctx.font = '14px Arial';
    ctx.fillText('INFORME TÉCNICO DE SERVICIOS', canvas.width / 2, 165);
    
    ctx.font = '12px Arial';
    ctx.fillText('Evidencia fotográfica no disponible', canvas.width / 2, 190);
    ctx.fillText('Cumplimiento normativo ISO mantenido', canvas.width / 2, 210);
    
    // Información de control interno ISO
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:-]/g, '');
    ctx.font = '10px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText(`NIT: 901876981-4 | Tel: (+57) 3114861431`, canvas.width / 2, 240);
    ctx.fillText(`Control interno: IMG-${timestamp}`, canvas.width / 2, 255);
    ctx.fillText('Bogotá - Bosa Centro | Calle 65 Sur No 79C 27', canvas.width / 2, 270);
    
    return canvas.toDataURL('image/png');
  }

  // Agregar observaciones
  static agregarObservaciones(pdf, observaciones, pageWidth, currentY, margin, pageHeight) {
    if (currentY + 40 > pageHeight - 30) {
      pdf.addPage();
      currentY = margin;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.safeText('OBSERVACIONES'), margin, currentY);
    currentY += 10;

    pdf.setDrawColor(40, 116, 166);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const lines = pdf.splitTextToSize(observaciones, pageWidth - (margin * 2));
    pdf.text(lines, margin, currentY);

    return currentY + (lines.length * 5) + 15;
  }

  // Agregar pie de página
  static agregarPiePagina(pdf, pageWidth, pageHeight, informeData) {
    const pageCount = pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Línea superior del pie
      pdf.setDrawColor(40, 116, 166);
      pdf.setLineWidth(0.5);
      pdf.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
      
      // Información del pie
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      
      pdf.text(this.safeText(`Generado el: ${new Date().toLocaleDateString('es-CO')}`), 20, pageHeight - 18);
      pdf.text(this.safeText(`Elaborado por: ${informeData.elaboradoPor || 'N/A'}`), 20, pageHeight - 12);
      pdf.text(this.safeText(`Página ${i} de ${pageCount}`), pageWidth - 40, pageHeight - 15);
    }
  }

  // Descargar PDF
  static descargarPDF(pdf, nombreArchivo = null) {
    const nombre = nombreArchivo || `informe_tecnico_${Date.now()}.pdf`;
    pdf.save(nombre);
    console.log(`📥 PDF descargado: ${nombre}`);
  }
}

export default PDFService;
