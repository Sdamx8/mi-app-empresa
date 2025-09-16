import jsPDF from 'jspdf';

/**
 * Generar PDF del informe técnico
 * @param {Object} informe - Datos completos del informe
 * @returns {Promise<jsPDF>} - PDF generado
 */
export const generarPDFInforme = async (informe) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPos = 20;

  // HEADER - Logo y título principal
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INFORME TÉCNICO DE MANTENIMIENTO', pageWidth/2, yPos, { align: 'center' });
  
  yPos += 15;
  pdf.setFontSize(12);
  pdf.text(`ID: ${informe.idInforme}`, pageWidth/2, yPos, { align: 'center' });
  
  // Línea separadora
  yPos += 10;
  pdf.line(20, yPos, pageWidth - 20, yPos);
  yPos += 15;

  // INFORMACIÓN GENERAL
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INFORMACIÓN GENERAL', 20, yPos);
  yPos += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const infoGeneral = [
    `Número de Remisión: ${informe.numeroRemision}`,
    `Fecha: ${informe.fechaRemision}`,
    `Móvil: ${informe.movil}`,
    `Autoriza: ${informe.autorizo}`,
    `Técnico: ${informe.tecnico}`,
    `Carrocería: ${informe.remisionEncontrada?.carroceria || 'N/A'}`,
    `UNE: ${informe.remisionEncontrada?.une || 'N/A'}`,
    `Estado: ${informe.estado}`
  ];

  infoGeneral.forEach(texto => {
    pdf.text(texto, 25, yPos);
    yPos += 6;
  });

  yPos += 10;

  // TRABAJOS REALIZADOS
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TRABAJOS REALIZADOS', 20, yPos);
  yPos += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Título del trabajo
  const tituloLines = pdf.splitTextToSize(informe.tituloTrabajo, pageWidth - 50);
  tituloLines.forEach(line => {
    pdf.text(line, 25, yPos);
    yPos += 6;
  });

  yPos += 5;

  // DESCRIPCIÓN DE ACTIVIDADES
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Descripción de Actividades:', 20, yPos);
  yPos += 8;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  informe.datosConsolidados.descripciones.forEach((descripcion, index) => {
    const descripcionLines = pdf.splitTextToSize(`${index + 1}. ${descripcion}`, pageWidth - 50);
    descripcionLines.forEach(line => {
      // Verificar si necesitamos nueva página
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(line, 25, yPos);
      yPos += 5;
    });
    yPos += 3;
  });

  // MATERIALES UTILIZADOS
  yPos += 10;
  if (yPos > pageHeight - 50) {
    pdf.addPage();
    yPos = 20;
  }

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Materiales Utilizados:', 20, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  informe.datosConsolidados.materiales.forEach((material, index) => {
    pdf.text(`• ${material}`, 25, yPos);
    yPos += 6;
  });

  // RECURSOS HUMANOS
  yPos += 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Recursos Humanos:', 20, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  informe.datosConsolidados.recursos.forEach((recurso, index) => {
    pdf.text(`• ${recurso}`, 25, yPos);
    yPos += 6;
  });

  // TIEMPO EMPLEADO
  yPos += 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Tiempo Empleado:', 20, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const tiempoTexto = `${informe.datosConsolidados.tiempoTotal.horas}h ${informe.datosConsolidados.tiempoTotal.minutos}min`;
  pdf.text(tiempoTexto, 25, yPos);

  // EVIDENCIA FOTOGRÁFICA (URLs solamente, las imágenes se pueden agregar después)
  yPos += 20;
  if (yPos > pageHeight - 80) {
    pdf.addPage();
    yPos = 20;
  }

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EVIDENCIA FOTOGRÁFICA', 20, yPos);
  yPos += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  if (informe.imagenesAntes.length > 0) {
    pdf.text('Fotos ANTES:', 25, yPos);
    yPos += 6;
    informe.imagenesAntes.forEach((img, index) => {
      pdf.text(`${index + 1}. ${img.name}`, 30, yPos);
      yPos += 5;
    });
    yPos += 5;
  }

  if (informe.imagenesDespues.length > 0) {
    pdf.text('Fotos DESPUÉS:', 25, yPos);
    yPos += 6;
    informe.imagenesDespues.forEach((img, index) => {
      pdf.text(`${index + 1}. ${img.name}`, 30, yPos);
      yPos += 5;
    });
  }

  // OBSERVACIONES TÉCNICAS
  if (informe.observacionesTecnicas && informe.observacionesTecnicas.trim()) {
    yPos += 15;
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OBSERVACIONES TÉCNICAS:', 20, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const observacionesLines = pdf.splitTextToSize(informe.observacionesTecnicas, pageWidth - 50);
    observacionesLines.forEach(line => {
      pdf.text(line, 25, yPos);
      yPos += 6;
    });
  }

  // FOOTER - Firma y fecha
  pdf.addPage();
  yPos = pageHeight - 60;

  pdf.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Elaborado por:', 20, yPos);
  pdf.text(informe.elaboradoPor, 60, yPos);

  yPos += 10;
  const fechaElaboracion = new Date(informe.creadoEn.seconds * 1000).toLocaleDateString('es-CO');
  pdf.text('Fecha de elaboración:', 20, yPos);
  pdf.text(fechaElaboracion, 80, yPos);

  yPos += 20;
  pdf.text('_________________________', 20, yPos);
  yPos += 6;
  pdf.text('Firma del Técnico', 20, yPos);

  pdf.text('_________________________', 120, yPos - 6);
  pdf.text('Firma de Supervisión', 120, yPos);

  return pdf;
};

/**
 * Descargar PDF del informe
 * @param {Object} informe - Datos del informe
 */
export const descargarPDFInforme = async (informe) => {
  try {
    const pdf = await generarPDFInforme(informe);
    const nombreArchivo = `informe_${informe.numeroRemision}_${Date.now()}.pdf`;
    pdf.save(nombreArchivo);
    return true;
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error('Error al generar el PDF del informe');
  }
};