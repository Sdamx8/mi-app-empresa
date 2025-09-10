// Servicio para generar PDFs de informes técnicos con soporte para múltiples imágenes
import jsPDF from 'jspdf';

export class PDFService {
  /**
   * Convierte cualquier valor a string seguro para pdf.text()
   * @param {any} value - Valor a convertir
   * @returns {string} String seguro para pdf.text()
   */
  static safeText(value) {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    return String(value);
  }

  static EMPRESA_CONFIG = {
    nombre: 'MI EMPRESA TÉCNICA S.A.S',
    nit: '900.123.456-7',
    direccion: 'Calle 123 #45-67, Bogotá D.C.',
    telefono: '+57 (1) 234-5678',
    email: 'contacto@miempresatecnica.com'
  };

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
    const imagenesParaPDF = {
      antes: [],
      despues: []
    };

    // Imágenes desde el objeto imagenes
    if (imagenes.antes) {
      if (Array.isArray(imagenes.antes)) {
        imagenesParaPDF.antes.push(...imagenes.antes);
      } else {
        imagenesParaPDF.antes.push(imagenes.antes);
      }
    }

    if (imagenes.despues) {
      if (Array.isArray(imagenes.despues)) {
        imagenesParaPDF.despues.push(...imagenes.despues);
      } else {
        imagenesParaPDF.despues.push(imagenes.despues);
      }
    }

    // PRIORIDAD 1: Usar imágenes base64 si están disponibles (evita problemas CORS)
    if (informeData.imagenAntesBase64) {
      console.log('✅ Usando base64 "antes" para evitar CORS');
      imagenesParaPDF.antes.push(informeData.imagenAntesBase64);
    } else if (informeData.imagenesAntesBase64 && Array.isArray(informeData.imagenesAntesBase64)) {
      console.log('✅ Usando múltiples base64 "antes" para evitar CORS');
      imagenesParaPDF.antes.push(...informeData.imagenesAntesBase64);
    } else {
      // FALLBACK: Usar URLs solo si no hay base64 disponible
      if (informeData.imagenAntesURL) {
        console.log('⚠️ Usando URL "antes" (puede fallar por CORS)');
        imagenesParaPDF.antes.push(informeData.imagenAntesURL);
      }
      if (informeData.imagenesAntesURLs && Array.isArray(informeData.imagenesAntesURLs)) {
        console.log('⚠️ Usando múltiples URLs "antes" (puede fallar por CORS)');
        imagenesParaPDF.antes.push(...informeData.imagenesAntesURLs);
      }
    }

    if (informeData.imagenDespuesBase64) {
      console.log('✅ Usando base64 "después" para evitar CORS');
      imagenesParaPDF.despues.push(informeData.imagenDespuesBase64);
    } else if (informeData.imagenesDespuesBase64 && Array.isArray(informeData.imagenesDespuesBase64)) {
      console.log('✅ Usando múltiples base64 "después" para evitar CORS');
      imagenesParaPDF.despues.push(...informeData.imagenesDespuesBase64);
    } else {
      // FALLBACK: Usar URLs solo si no hay base64 disponible
      if (informeData.imagenDespuesURL) {
        console.log('⚠️ Usando URL "después" (puede fallar por CORS)');
        imagenesParaPDF.despues.push(informeData.imagenDespuesURL);
      }
      if (informeData.imagenesDespuesURLs && Array.isArray(informeData.imagenesDespuesURLs)) {
        console.log('⚠️ Usando múltiples URLs "después" (puede fallar por CORS)');
        imagenesParaPDF.despues.push(...informeData.imagenesDespuesURLs);
      }
    }

    // Filtrar URLs válidas
    imagenesParaPDF.antes = imagenesParaPDF.antes.filter(url => url && url.trim() !== '');
    imagenesParaPDF.despues = imagenesParaPDF.despues.filter(url => url && url.trim() !== '');

    console.log('📊 Resumen de imágenes para PDF:', {
      antes: imagenesParaPDF.antes.length,
      despues: imagenesParaPDF.despues.length
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

    // ✅ CORREGIDO: Mapeo correcto de campos
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
    
    const lines = pdf.splitTextToSize(descripcion, pageWidth - (margin * 2));
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

  // Procesar imagen para PDF
  static async processImageForPDF(imageUrl) {
    console.log('🖼️ Procesando imagen para PDF:', imageUrl);
    
    // Si la URL ya es un data URL, devolverla directamente
    if (imageUrl.startsWith('data:')) {
      console.log('✅ Imagen ya en formato data URL');
      return imageUrl;
    }
    
    // Primero intentar con fetch para evitar problemas CORS
    try {
      console.log('🔄 Intentando cargar imagen con fetch...');
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (fetchError) {
      console.warn('⚠️ Fetch falló, intentando con Image:', fetchError.message);
    }
    
    // Fallback: Intentar con Image elemento (puede fallar por CORS)
    return new Promise((resolve, reject) => {
      if (!imageUrl || typeof imageUrl !== 'string') {
        console.error('❌ URL de imagen inválida:', imageUrl);
        reject(new Error('URL de imagen inválida'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = function() {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.drawImage(img, 0, 0);
          
          const dataURL = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataURL);
        } catch (error) {
          console.error('❌ Error procesando imagen:', error);
          reject(error);
        }
      };
      
      img.onerror = function(error) {
        console.error('❌ Error cargando imagen con Image element:', error, imageUrl);
        console.log('💡 Sugerencia: Configurar CORS en Firebase Storage o usar método alternativo');
        
        // En lugar de rechazar, intentar un último método
        PDFService.tryAlternativeImageLoad(imageUrl)
          .then(resolve)
          .catch(reject);
      };
      
      img.src = imageUrl;
    });
  }

  // Método alternativo para cargar imágenes cuando falla CORS
  static async tryAlternativeImageLoad(imageUrl) {
    console.log('🔄 Intentando método alternativo para:', imageUrl);
    
    try {
      // Crear un iframe oculto para intentar cargar la imagen
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'about:blank';
      document.body.appendChild(iframe);
      
      return new Promise((resolve, reject) => {
        iframe.onload = () => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const img = iframeDoc.createElement('img');
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
              try {
                const canvas = iframeDoc.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                document.body.removeChild(iframe);
                resolve(dataURL);
              } catch (canvasError) {
                document.body.removeChild(iframe);
                reject(canvasError);
              }
            };
            
            img.onerror = () => {
              document.body.removeChild(iframe);
              reject(new Error('Error en método alternativo de carga'));
            };
            
            img.src = imageUrl;
          } catch (iframeError) {
            document.body.removeChild(iframe);
            reject(iframeError);
          }
        };
        
        // Timeout para evitar que se cuelgue
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
            reject(new Error('Timeout en método alternativo'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('❌ Error en método alternativo:', error);
      throw new Error(`No se pudo cargar la imagen: ${imageUrl}. Error CORS - Configure CORS en Firebase Storage.`);
    }
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
