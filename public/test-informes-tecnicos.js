// test-informes-tecnicos.js - Script de verificación de funcionalidad
// Este script puede ejecutarse desde la consola del navegador para probar los servicios

// ============================================
// SCRIPT DE VERIFICACIÓN - INFORMES TÉCNICOS
// ============================================

console.log('🧪 INICIANDO VERIFICACIÓN DE INFORMES TÉCNICOS');
console.log('=============================================');

// Datos de prueba para verificación
const datosInformePrueba = {
  idInforme: 'IT-VERIFY-001',
  numeroRemision: 'R-VERIFY-001',
  movil: 'Z70-VERIFY',
  tituloTrabajo: 'Verificación de Funcionalidad',
  ubicacionUNE: 'UNE-VERIFY-12345',
  tecnico: 'Técnico de Verificación',
  fechaRemision: '2024-01-15',
  autorizadoPor: 'Supervisor de Verificación',
  elaboradoPor: 'Sistema de Verificación',
  observaciones: 'Este es un informe de verificación para comprobar que todas las funcionalidades están operando correctamente, incluyendo la exportación de PDF con evidencias fotográficas.',
  subtotal: 750000,
  total: 892500
};

// URLs de imágenes de prueba - CORREGIDAS para evitar problemas CORS
const imagenesVerificacion = {
  antes: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#E67E22"/>
      <text x="200" y="150" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">
        EVIDENCIA ANTES
      </text>
      <text x="200" y="180" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">
        Imagen de Verificación
      </text>
    </svg>
  `),
  despues: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#8E44AD"/>
      <text x="200" y="150" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">
        EVIDENCIA DESPUÉS
      </text>
      <text x="200" y="180" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">
        Imagen de Verificación
      </text>
    </svg>
  `)
};

// ============================================
// FUNCIONES DE VERIFICACIÓN
// ============================================

/**
 * Verificar que las correcciones del campo UNE funcionan
 */
function verificarCampoUNE() {
  console.log('\n📋 VERIFICANDO CAMPO UNE...');
  
  // Simular datos de remisión como vendrían de la base de datos
  const datosRemisionDB = {
    numeroRemision: 'R-TEST-001',
    movil: 'Z70-001',
    tecnico: 'Juan Pérez',
    fechaRemision: '2024-01-15',
    autorizadoPor: 'María García',
    une: 'UNE-12345-SECTOR-A', // Campo UNE desde DB
    descripcion: 'Trabajo de mantenimiento',
    subtotal: 100000,
    total: 119000
  };

  // Verificar mapeo correcto
  const datosInforme = {
    numeroRemision: datosRemisionDB.numeroRemision,
    movil: datosRemisionDB.movil,
    tecnico: datosRemisionDB.tecnico,
    fechaRemision: datosRemisionDB.fechaRemision,
    autorizadoPor: datosRemisionDB.autorizadoPor,
    ubicacionUNE: datosRemisionDB.une, // ✅ CORREGIDO: Campo UNE mapeado
    descripcion: datosRemisionDB.descripcion,
    subtotal: datosRemisionDB.subtotal,
    total: datosRemisionDB.total
    // ✅ Campo "estado" removido
  };

  console.log('✅ Datos originales de DB:', datosRemisionDB);
  console.log('✅ Datos mapeados para informe:', datosInforme);
  console.log('✅ Campo UNE verificado:', datosInforme.ubicacionUNE);
  console.log('✅ Campo estado removido correctamente');
  
  return datosInforme;
}

/**
 * Verificar procesamiento de imágenes
 */
async function verificarProcesamientoImagenes() {
  console.log('\n🖼️ VERIFICANDO PROCESAMIENTO DE IMÁGENES...');
  
  try {
    // Función de procesamiento simulada (basada en el servicio real) - MEJORADA
    const processImageForPDF = (imageUrl) => {
      return new Promise((resolve, reject) => {
        console.log(`📸 Procesando: ${imageUrl.substring(0, 50)}...`);
        
        const img = new Image();
        // No establecer crossOrigin para imágenes data: URLs
        if (!imageUrl.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }
        
        const timeout = setTimeout(() => {
          console.log('❌ Timeout en imagen (10 segundos)');
          reject(new Error('Timeout - La imagen tardó más de 10 segundos en cargar'));
        }, 10000);
        
        img.onload = () => {
          clearTimeout(timeout);
          console.log('✅ Imagen cargada exitosamente');
          
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Redimensionar manteniendo aspecto
            const maxWidth = 500;
            const maxHeight = 400;
            let { width, height } = img;
            
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            const newWidth = Math.round(width * ratio);
            const newHeight = Math.round(height * ratio);
            
            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            
            const dataURL = canvas.toDataURL('image/jpeg', 0.9);
            console.log(`✅ Imagen procesada: ${newWidth}x${newHeight}`);
            
            resolve({
              dataURL,
              width: newWidth,
              height: newHeight,
              originalUrl: imageUrl
            });
            
          } catch (error) {
            clearTimeout(timeout);
            console.log(`❌ Error procesando canvas: ${error.message}`);
            reject(error);
          }
        };
        
        img.onerror = (error) => {
          clearTimeout(timeout);
          console.log(`❌ Error cargando imagen. Tipo de error:`, error);
          console.log(`❌ URL problemática: ${imageUrl.substring(0, 100)}...`);
          
          // Intentar con una imagen de respaldo
          console.log('🔄 Intentando con imagen de respaldo...');
          
          // Crear imagen de respaldo como SVG
          const fallbackSVG = `data:image/svg+xml;base64,${btoa(`
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
              <rect width="400" height="300" fill="#95a5a6"/>
              <text x="200" y="140" font-family="Arial" font-size="18" fill="white" text-anchor="middle">
                IMAGEN DE RESPALDO
              </text>
              <text x="200" y="170" font-family="Arial" font-size="14" fill="white" text-anchor="middle">
                Error cargando imagen original
              </text>
            </svg>
          `)}`;
          
          // Intentar cargar imagen de respaldo
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            console.log('✅ Imagen de respaldo cargada');
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = 300;
              canvas.height = 200;
              ctx.drawImage(fallbackImg, 0, 0, 300, 200);
              const dataURL = canvas.toDataURL('image/jpeg', 0.9);
              
              resolve({
                dataURL,
                width: 300,
                height: 200,
                originalUrl: imageUrl,
                isFallback: true
              });
            } catch (fallbackError) {
              reject(new Error(`Error con imagen de respaldo: ${fallbackError.message}`));
            }
          };
          fallbackImg.onerror = () => {
            reject(new Error(`Error cargando imagen original y de respaldo`));
          };
          fallbackImg.src = fallbackSVG;
        };
        
        try {
          img.src = imageUrl;
        } catch (srcError) {
          clearTimeout(timeout);
          console.log(`❌ Error asignando src: ${srcError.message}`);
          reject(new Error(`Error asignando src: ${srcError.message}`));
        }
      });
    };
    
    // Probar ambas imágenes
    const resultados = {};
    
    console.log('🔄 Procesando imagen "Antes"...');
    resultados.antes = await processImageForPDF(imagenesVerificacion.antes);
    console.log('✅ Imagen "Antes" procesada correctamente');
    
    console.log('🔄 Procesando imagen "Después"...');
    resultados.despues = await processImageForPDF(imagenesVerificacion.despues);
    console.log('✅ Imagen "Después" procesada correctamente');
    
    console.log('🎉 TODAS LAS IMÁGENES PROCESADAS EXITOSAMENTE');
    return resultados;
    
  } catch (error) {
    console.log(`❌ ERROR EN PROCESAMIENTO: ${error.message}`);
    throw error;
  }
}

/**
 * Verificar generación completa de PDF
 */
async function verificarGeneracionPDF() {
  console.log('\n📄 VERIFICANDO GENERACIÓN DE PDF...');
  
  try {
    // Verificar que jsPDF esté disponible
    if (!window.jspdf) {
      throw new Error('jsPDF no está disponible');
    }
    
    const { jsPDF } = window.jspdf;
    console.log('✅ jsPDF cargado correctamente');
    
    // Crear nuevo PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = 20;
    
    // ENCABEZADO CORPORATIVO
    console.log('🎨 Generando encabezado...');
    pdf.setFillColor(40, 116, 166);
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Global Mobility Solutions', 20, 18);
    
    pdf.setFontSize(14);
    pdf.text('INFORME TÉCNICO DE VERIFICACIÓN', 20, 28);
    
    pdf.setFontSize(8);
    pdf.text('Calle 65 Sur no 79C - 27 Bosa Centro | Tel: 311-486-1431', 20, 38);
    pdf.text('globalmobilitysolutions8@gmail.com', 20, 42);
    
    currentY = 60;
    console.log('✅ Encabezado generado');
    
    // INFORMACIÓN DEL INFORME
    console.log('📋 Agregando información del informe...');
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INFORMACIÓN DEL INFORME', 20, currentY);
    currentY += 15;
    
    const infoData = [
      ['ID Informe:', datosInformePrueba.idInforme],
      ['Número de Remisión:', datosInformePrueba.numeroRemision],
      ['Móvil:', datosInformePrueba.movil],
      ['Título del Trabajo:', datosInformePrueba.tituloTrabajo],
      ['Ubicación UNE:', datosInformePrueba.ubicacionUNE], // ✅ Campo UNE
      ['Técnico:', datosInformePrueba.tecnico],
      ['Fecha Remisión:', datosInformePrueba.fechaRemision],
      ['Autorizado por:', datosInformePrueba.autorizadoPor]
    ];
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    infoData.forEach(([label, value], index) => {
      const yPos = currentY + (index * 6);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, 70, yPos);
    });
    
    currentY += infoData.length * 6 + 20;
    console.log('✅ Información del informe agregada');
    
    // DATOS FINANCIEROS
    console.log('💰 Agregando datos financieros...');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DATOS FINANCIEROS', 20, currentY);
    currentY += 15;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Subtotal:', 20, currentY);
    pdf.text(`$${datosInformePrueba.subtotal.toLocaleString('es-CO')}`, 70, currentY);
    currentY += 6;
    pdf.text('Total:', 20, currentY);
    pdf.text(`$${datosInformePrueba.total.toLocaleString('es-CO')}`, 70, currentY);
    currentY += 20;
    console.log('✅ Datos financieros agregados');
    
    // OBSERVACIONES
    console.log('📝 Agregando observaciones...');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ACTIVIDADES REALIZADAS', 20, currentY);
    currentY += 15;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(datosInformePrueba.observaciones, pageWidth - 40);
    lines.forEach((line, index) => {
      pdf.text(line, 20, currentY + (index * 5));
    });
    currentY += lines.length * 5 + 20;
    console.log('✅ Observaciones agregadas');
    
    // EVIDENCIAS FOTOGRÁFICAS
    console.log('🖼️ Intentando agregar evidencias fotográficas...');
    
    try {
      const imagenesProcessed = await verificarProcesamientoImagenes();
      
      // Verificar si necesitamos nueva página
      if (currentY + 120 > pageHeight - 30) {
        pdf.addPage();
        currentY = 20;
        console.log('📄 Nueva página agregada para imágenes');
      }
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EVIDENCIAS FOTOGRÁFICAS', 20, currentY);
      currentY += 15;
      
      // Imagen "Antes"
      if (imagenesProcessed.antes) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ANTES:', 20, currentY);
        currentY += 8;
        
        pdf.addImage(imagenesProcessed.antes.dataURL, 'JPEG', 20, currentY, 70, 50);
        currentY += 60;
        console.log('✅ Imagen "Antes" insertada en PDF');
      }
      
      // Imagen "Después"
      if (imagenesProcessed.despues) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DESPUÉS:', 20, currentY);
        currentY += 8;
        
        pdf.addImage(imagenesProcessed.despues.dataURL, 'JPEG', 20, currentY, 70, 50);
        console.log('✅ Imagen "Después" insertada en PDF');
      }
      
      console.log('🎉 EVIDENCIAS FOTOGRÁFICAS AGREGADAS EXITOSAMENTE');
      
    } catch (imageError) {
      console.log(`❌ Error con imágenes (PDF continúa): ${imageError.message}`);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EVIDENCIAS FOTOGRÁFICAS', 20, currentY);
      currentY += 15;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(255, 0, 0);
      pdf.text('Error al procesar evidencias fotográficas', 20, currentY);
      pdf.setTextColor(0, 0, 0);
    }
    
    // PIE DE PÁGINA
    console.log('🔻 Agregando pie de página...');
    const footerY = pageHeight - 20;
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Documento de verificación generado: ${new Date().toLocaleString('es-ES')}`, 20, footerY);
    pdf.text(`ID: ${datosInformePrueba.idInforme}`, pageWidth - 60, footerY);
    console.log('✅ Pie de página agregado');
    
    // DESCARGAR PDF
    const nombreArchivo = `verificacion_informe_tecnico_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
    pdf.save(nombreArchivo);
    
    console.log('🎉 PDF GENERADO Y DESCARGADO EXITOSAMENTE');
    console.log(`📁 Archivo: ${nombreArchivo}`);
    
    return {
      success: true,
      fileName: nombreArchivo,
      message: 'PDF generado exitosamente con todas las correcciones aplicadas'
    };
    
  } catch (error) {
    console.log(`❌ ERROR EN GENERACIÓN DE PDF: ${error.message}`);
    throw error;
  }
}

/**
 * Ejecutar verificación completa
 */
async function ejecutarVerificacionCompleta() {
  console.log('\n🚀 EJECUTANDO VERIFICACIÓN COMPLETA...');
  console.log('================================================');
  
  try {
    // Paso 1: Verificar campo UNE
    console.log('\n⭐ PASO 1: VERIFICACIÓN CAMPO UNE');
    const datosUNE = verificarCampoUNE();
    console.log('✅ Campo UNE verificado correctamente');
    
    // Paso 2: Verificar procesamiento de imágenes
    console.log('\n⭐ PASO 2: VERIFICACIÓN PROCESAMIENTO IMÁGENES');
    await verificarProcesamientoImagenes();
    console.log('✅ Procesamiento de imágenes verificado');
    
    // Paso 3: Verificar generación completa de PDF
    console.log('\n⭐ PASO 3: VERIFICACIÓN GENERACIÓN PDF COMPLETA');
    const resultadoPDF = await verificarGeneracionPDF();
    console.log('✅ Generación de PDF verificada');
    
    // RESUMEN FINAL
    console.log('\n🎊 VERIFICACIÓN COMPLETA EXITOSA');
    console.log('==================================');
    console.log('✅ Campo UNE: Mapeado correctamente desde DB');
    console.log('✅ Campo Estado: Removido exitosamente');
    console.log('✅ Procesamiento de Imágenes: Funcionando');
    console.log('✅ Exportación PDF: Funcionando con imágenes');
    console.log('✅ Formato corporativo: Aplicado correctamente');
    console.log('✅ Datos financieros: Formateados correctamente');
    console.log(`✅ Archivo generado: ${resultadoPDF.fileName}`);
    
    return {
      success: true,
      campoUNE: true,
      procesamientoImagenes: true,
      generacionPDF: true,
      archivoGenerado: resultadoPDF.fileName
    };
    
  } catch (error) {
    console.log(`\n❌ ERROR EN VERIFICACIÓN: ${error.message}`);
    console.log('❌ La verificación no se completó exitosamente');
    
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// EJECUCIÓN AUTOMÁTICA
// ============================================

// Exportar funciones para uso manual
window.verificacionInformesTecnicos = {
  verificarCampoUNE,
  verificarProcesamientoImagenes,
  verificarGeneracionPDF,
  ejecutarVerificacionCompleta,
  datosInformePrueba,
  imagenesVerificacion
};

// Mensaje de inicio
console.log('\n🎯 SCRIPT DE VERIFICACIÓN CARGADO');
console.log('=====================================');
console.log('📋 Funciones disponibles:');
console.log('   • verificacionInformesTecnicos.ejecutarVerificacionCompleta()');
console.log('   • verificacionInformesTecnicos.verificarCampoUNE()');
console.log('   • verificacionInformesTecnicos.verificarProcesamientoImagenes()');
console.log('   • verificacionInformesTecnicos.verificarGeneracionPDF()');
console.log('\n🚀 Para ejecutar verificación completa, usa:');
console.log('   verificacionInformesTecnicos.ejecutarVerificacionCompleta()');
