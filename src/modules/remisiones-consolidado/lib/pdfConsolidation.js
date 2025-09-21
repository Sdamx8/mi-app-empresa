/**
 * 📄 PDF Consolidation Service
 * ===========================
 * Servicio para consolidar múltiples PDFs en un documento único
 * Orden de consolidación: Orden de Trabajo → Remisión Escaneada → Informe Técnico
 * 
 * @author: Global Mobility Solutions
 * @version: 2.0.0
 * @date: September 2025
 */

import { PDFDocument, rgb } from 'pdf-lib';
import jsPDF from 'jspdf';

/**
 * Convierte una imagen a PDF usando jsPDF
 */
const convertImageToPDF = async (imageBlob, fileName = 'document.pdf') => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const img = new Image();
          
          img.onload = function() {
            // Crear nuevo PDF
            const pdf = new jsPDF({
              orientation: img.width > img.height ? 'landscape' : 'portrait',
              unit: 'mm',
              format: 'a4'
            });
            
            // Calcular dimensiones para ajustar a la página
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgRatio = img.width / img.height;
            const pageRatio = pdfWidth / pdfHeight;
            
            let width, height;
            
            if (imgRatio > pageRatio) {
              // La imagen es más ancha proporcionalmente
              width = pdfWidth - 20; // Margen de 10mm a cada lado
              height = width / imgRatio;
            } else {
              // La imagen es más alta proporcionalmente
              height = pdfHeight - 20; // Margen de 10mm arriba y abajo
              width = height * imgRatio;
            }
            
            // Centrar la imagen
            const x = (pdfWidth - width) / 2;
            const y = (pdfHeight - height) / 2;
            
            // Agregar imagen al PDF
            pdf.addImage(e.target.result, 'JPEG', x, y, width, height);
            
            // Convertir a ArrayBuffer
            const pdfBytes = pdf.output('arraybuffer');
            resolve(new Uint8Array(pdfBytes));
          };
          
          img.onerror = function() {
            reject(new Error('Error al cargar la imagen'));
          };
          
          img.src = e.target.result;
          
        } catch (error) {
          reject(new Error('Error al procesar la imagen: ' + error.message));
        }
      };
      
      reader.onerror = function() {
        reject(new Error('Error al leer el archivo de imagen'));
      };
      
      reader.readAsDataURL(imageBlob);
      
    } catch (error) {
      reject(new Error('Error al convertir imagen a PDF: ' + error.message));
    }
  });
};

/**
 * Obtiene el ArrayBuffer de un archivo desde una URL
 */
const fetchFileAsArrayBuffer = async (url) => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error fetching file:', error);
    throw new Error('Error al obtener el archivo: ' + error.message);
  }
};

/**
 * Determina si un archivo es una imagen basándose en su tipo MIME o URL
 */
const isImageFile = (fileType, fileName = '') => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  if (fileType && imageTypes.includes(fileType.toLowerCase())) {
    return true;
  }
  
  if (fileName) {
    const extension = fileName.toLowerCase().split('.').pop();
    return imageExtensions.includes('.' + extension);
  }
  
  return false;
};

/**
 * Crea una página de portada para el PDF consolidado
 */
const createCoverPage = async (remision) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    
    // Título principal
    page.drawText('REMISIÓN CONSOLIDADA', {
      x: width / 2 - 100,
      y: height - 100,
      size: 24,
      color: rgb(0, 0.2, 0.5)
    });
    
    // Información de la remisión
    const info = [
      `Remisión: ${remision.remision || 'N/A'}`,
      `Móvil: ${remision.movil || 'N/A'}`,
      `No. Orden: ${remision.no_orden || 'N/A'}`,
      `Estado: ${remision.estado || 'N/A'}`,
      `UNE: ${remision.une || 'N/A'}`,
      `Fecha: ${remision.fecha_remision ? new Date(remision.fecha_remision).toLocaleDateString('es-CO') : 'N/A'}`,
      `Total: ${remision.total ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(remision.total) : 'N/A'}`
    ];
    
    let yPos = height - 200;
    info.forEach(line => {
      page.drawText(line, {
        x: 50,
        y: yPos,
        size: 14,
        color: rgb(0, 0, 0)
      });
      yPos -= 25;
    });
    
    // Pie de página
    page.drawText(`Generado el ${new Date().toLocaleString('es-CO')}`, {
      x: 50,
      y: 50,
      size: 10,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error creating cover page:', error);
    throw new Error('Error al crear la página de portada');
  }
};

/**
 * Función principal para consolidar PDFs
 */
export const consolidatePDFs = async (attachments, remision, options = {}) => {
  try {
    console.log('Iniciando consolidación de PDFs...', { attachments, remision });
    
    const {
      includeCover = false, // Cambiado a false por defecto - no incluir portada
      fileName = null,
      orderSequence = ['orden_trabajo', 'remision_escaneada', 'informe_tecnico']
    } = options;
    
    // Crear documento PDF consolidado
    const mergedPdf = await PDFDocument.create();
    
    // Agregar página de portada si se solicita
    if (includeCover) {
      const coverBytes = await createCoverPage(remision);
      const coverPdf = await PDFDocument.load(coverBytes);
      const coverPages = await mergedPdf.copyPages(coverPdf, [0]);
      mergedPdf.addPage(coverPages[0]);
    }
    
    // Procesar archivos en el orden especificado
    for (const attachmentType of orderSequence) {
      const attachment = attachments[attachmentType];
      
      if (!attachment?.url) {
        console.log(`Saltando ${attachmentType} - no disponible`);
        continue;
      }
      
      try {
        console.log(`Procesando ${attachmentType}:`, attachment);
        
        // Obtener el archivo
        const fileBuffer = await fetchFileAsArrayBuffer(attachment.url);
        
        // Determinar si es imagen o PDF
        const isImage = isImageFile(attachment.type, attachment.name);
        
        if (isImage) {
          // Convertir imagen a PDF
          console.log(`Convirtiendo imagen ${attachmentType} a PDF...`);
          const imageBlob = new Blob([fileBuffer], { type: attachment.type });
          const imagePdfBytes = await convertImageToPDF(imageBlob, attachment.name);
          
          // Cargar PDF convertido
          const imagePdf = await PDFDocument.load(imagePdfBytes);
          const imagePages = await mergedPdf.copyPages(imagePdf, imagePdf.getPageIndices());
          
          imagePages.forEach(page => mergedPdf.addPage(page));
          
        } else {
          // Es un PDF, copiarlo directamente
          console.log(`Agregando PDF ${attachmentType}...`);
          const attachmentPdf = await PDFDocument.load(fileBuffer);
          const pdfPages = await mergedPdf.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
          
          pdfPages.forEach(page => mergedPdf.addPage(page));
        }
        
        console.log(`${attachmentType} agregado exitosamente`);
        
      } catch (error) {
        console.error(`Error procesando ${attachmentType}:`, error);
        // Continuar con los demás archivos aunque uno falle
        continue;
      }
    }
    
    // Verificar que el PDF tenga al menos una página
    if (mergedPdf.getPageCount() === 0) {
      throw new Error('No se pudo generar el PDF consolidado - no hay páginas válidas');
    }
    
    // Generar nombre del archivo con formato: no_orden_movil.pdf
    const ordenNumber = (remision.no_orden || 'ORDEN').replace(/[^a-zA-Z0-9]/g, '');
    const movilNumber = (remision.movil || 'MOVIL').replace(/[^a-zA-Z0-9-]/g, '');
    const finalFileName = fileName || `${ordenNumber}_${movilNumber}.pdf`;
    
    // Guardar PDF consolidado
    const pdfBytes = await mergedPdf.save();
    
    console.log('PDF consolidado generado exitosamente');
    
    return {
      success: true,
      pdfBytes,
      fileName: finalFileName,
      pageCount: mergedPdf.getPageCount(),
      processedAttachments: orderSequence.filter(type => attachments[type]?.url)
    };
    
  } catch (error) {
    console.error('Error en consolidatePDFs:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al consolidar PDFs'
    };
  }
};

/**
 * Función para descargar el PDF consolidado
 */
export const downloadConsolidatedPDF = async (attachments, remision, options = {}) => {
  try {
    const result = await consolidatePDFs(attachments, remision, options);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Crear blob y descargar
    const blob = new Blob([result.pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Crear enlace temporal para descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar URL temporal
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      fileName: result.fileName,
      pageCount: result.pageCount
    };
    
  } catch (error) {
    console.error('Error downloading consolidated PDF:', error);
    return {
      success: false,
      error: error.message || 'Error al descargar el PDF'
    };
  }
};

/**
 * Función para validar que los archivos necesarios estén disponibles
 */
export const validateAttachmentsForConsolidation = (attachments) => {
  const available = [];
  const missing = [];
  
  const requiredTypes = ['orden_trabajo', 'remision_escaneada', 'informe_tecnico'];
  
  requiredTypes.forEach(type => {
    if (attachments[type]?.url) {
      available.push(type);
    } else {
      missing.push(type);
    }
  });
  
  return {
    canConsolidate: available.length > 0,
    available,
    missing,
    availableCount: available.length,
    totalCount: requiredTypes.length
  };
};

export default {
  consolidatePDFs,
  downloadConsolidatedPDF,
  validateAttachmentsForConsolidation
};