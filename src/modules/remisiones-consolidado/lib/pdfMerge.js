/**
 * 📄 PDF MERGE - Consolidación de PDFs usando pdf-lib
 * =================================================
 * Funciones para combinar orden de trabajo + remisión escaneada + informe técnico
 * en un único PDF consolidado sin pérdida de calidad
 * 
 * @author: Global Mobility Solutions
 * @version: 1.0.0
 * @date: September 2025
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  doc,
  updateDoc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '../../../core/config/firebaseConfig';

/**
 * Generate a consolidated PDF combining:
 * 1. Orden de trabajo (uploaded PDF or generated summary)
 * 2. Remisión escaneada (PDF or image converted to PDF)
 * 3. Informe técnico (generated PDF with photos and text)
 */
export const generateConsolidatedPDF = async ({
  remisionId,
  remisionData,
  userEmail
}) => {
  console.log('🔄 Generating consolidated PDF for remision:', remisionId);

  try {
    // Create new PDF document
    const pdfDoc = await PDFDocument.create();

    // 1. Add Orden de Trabajo
    await addOrdenToPDF(pdfDoc, remisionData);

    // 2. Add Remisión Escaneada
    await addRemisionToPDF(pdfDoc, remisionData);

    // 3. Add Informe Técnico
    await addInformeToPDF(pdfDoc, remisionId, remisionData);

    // Generate final PDF bytes
    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

    // Upload to Firebase Storage
    const fileName = `${remisionData.no_orden}_${remisionData.movil}.pdf`;
    const storagePath = `remisiones/${remisionId}/consolidado/${fileName}`;
    const storageRef = ref(storage, storagePath);

    console.log('📤 Uploading consolidated PDF to:', storagePath);
    const snapshot = await uploadBytes(storageRef, pdfBlob);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Update Firestore with consolidado info
    const remisionRef = doc(db, 'remisiones', remisionId);
    await updateDoc(remisionRef, {
      consolidado_url: downloadURL,
      consolidado_creado_en: serverTimestamp(),
      consolidado_creado_por: userEmail,
      consolidado_nombre_archivo: fileName,
      informe_status: 'consolidado',
      updated_at: serverTimestamp()
    });

    console.log('✅ Consolidated PDF generated successfully:', downloadURL);
    return downloadURL;

  } catch (error) {
    console.error('❌ Error generating consolidated PDF:', error);
    throw error;
  }
};

/**
 * Add Orden de Trabajo to PDF
 */
const addOrdenToPDF = async (pdfDoc, remisionData) => {
  console.log('📄 Adding Orden de Trabajo to PDF');

  try {
    if (remisionData.adjuntos?.orden_url) {
      // Case 1: User uploaded an orden PDF - embed it
      const ordenPdfBytes = await fetchPDFFromURL(remisionData.adjuntos.orden_url);
      const ordenPdf = await PDFDocument.load(ordenPdfBytes);
      const copiedPages = await pdfDoc.copyPages(ordenPdf, ordenPdf.getPageIndices());
      
      copiedPages.forEach((page) => pdfDoc.addPage(page));
      console.log('✅ Orden PDF embedded from uploaded file');
    } else {
      // Case 2: Generate orden summary page
      await generateOrdenSummaryPage(pdfDoc, remisionData);
      console.log('✅ Orden summary page generated');
    }
  } catch (error) {
    console.error('❌ Error adding orden:', error);
    // Add error page instead of failing
    await addErrorPage(pdfDoc, 'Error cargando Orden de Trabajo', error.message);
  }
};

/**
 * Add Remisión Escaneada to PDF
 */
const addRemisionToPDF = async (pdfDoc, remisionData) => {
  console.log('🖼️ Adding Remisión Escaneada to PDF');

  try {
    if (remisionData.adjuntos?.remision_url) {
      const remisionUrl = remisionData.adjuntos.remision_url;
      
      // Check if it's a PDF or image
      if (remisionUrl.toLowerCase().includes('.pdf')) {
        // It's a PDF - embed it
        const remisionPdfBytes = await fetchPDFFromURL(remisionUrl);
        const remisionPdf = await PDFDocument.load(remisionPdfBytes);
        const copiedPages = await pdfDoc.copyPages(remisionPdf, remisionPdf.getPageIndices());
        
        copiedPages.forEach((page) => pdfDoc.addPage(page));
        console.log('✅ Remisión PDF embedded');
      } else {
        // It's an image - convert to PDF page
        await addImageToPDF(pdfDoc, remisionUrl, 'Remisión Escaneada');
        console.log('✅ Remisión image converted to PDF page');
      }
    } else {
      // No remisión uploaded - add placeholder
      await addPlaceholderPage(pdfDoc, 'Remisión No Adjunta', 
        'La remisión escaneada no fue adjuntada al momento de generar este consolidado.');
    }
  } catch (error) {
    console.error('❌ Error adding remisión:', error);
    await addErrorPage(pdfDoc, 'Error cargando Remisión Escaneada', error.message);
  }
};

/**
 * Add Informe Técnico to PDF
 */
const addInformeToPDF = async (pdfDoc, remisionId, remisionData) => {
  console.log('📋 Adding Informe Técnico to PDF');

  try {
    // Get latest informe from subcollection
    const informeData = await getLatestInforme(remisionId);
    
    if (informeData) {
      await generateInformeTecnicoPages(pdfDoc, informeData, remisionData);
      console.log('✅ Informe técnico pages generated');
    } else {
      await addPlaceholderPage(pdfDoc, 'Informe Técnico No Creado', 
        'El informe técnico no ha sido creado para esta remisión.');
    }
  } catch (error) {
    console.error('❌ Error adding informe:', error);
    await addErrorPage(pdfDoc, 'Error cargando Informe Técnico', error.message);
  }
};

/**
 * Generate Orden Summary Page when no PDF is uploaded
 */
const generateOrdenSummaryPage = async (pdfDoc, remisionData) => {
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  
  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Header
  page.drawText('ORDEN DE TRABAJO - NO ADJUNTA', {
    x: 50,
    y: height - 80,
    size: 20,
    font: boldFont,
    color: rgb(0.8, 0, 0) // Red color to indicate missing
  });

  page.drawText('Resumen de datos de la orden', {
    x: 50,
    y: height - 110,
    size: 14,
    font: font,
    color: rgb(0.3, 0.3, 0.3)
  });

  // Order details
  let yPos = height - 160;
  const lineHeight = 25;

  const orderFields = [
    ['N° de Orden:', remisionData.no_orden || 'No especificado'],
    ['Remisión:', remisionData.remision || 'No especificado'],
    ['Móvil:', remisionData.movil || 'No especificado'],
    ['Estado:', remisionData.estado || 'No especificado'],
    ['Fecha Remisión:', formatDate(remisionData.fecha_remision) || 'No especificado'],
    ['Técnico 1:', remisionData.tecnico1 || 'No asignado'],
    ['Técnico 2:', remisionData.tecnico2 || 'No asignado'],
    ['Técnico 3:', remisionData.tecnico3 || 'No asignado'],
    ['Subtotal:', formatCurrency(remisionData.subtotal) || '$0'],
    ['Total:', formatCurrency(remisionData.total) || '$0'],
    ['Generado por:', remisionData.genero || 'Sistema'],
  ];

  orderFields.forEach(([label, value]) => {
    page.drawText(label, {
      x: 50,
      y: yPos,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    page.drawText(value, {
      x: 200,
      y: yPos,
      size: 12,
      font: font,
      color: rgb(0, 0, 0)
    });

    yPos -= lineHeight;
  });

  // Footer note
  page.drawText('NOTA: Esta página fue generada automáticamente porque no se adjuntó', {
    x: 50,
    y: 100,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  });

  page.drawText('el archivo PDF de la orden de trabajo original.', {
    x: 50,
    y: 85,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  });
};

/**
 * Generate Informe Técnico pages with photos and text
 */
const generateInformeTecnicoPages = async (pdfDoc, informeData, remisionData) => {
  // Page 1: Header and description
  const page1 = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page1.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Header
  page1.drawText('INFORME TÉCNICO', {
    x: 50,
    y: height - 80,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0.8)
  });

  // Remision info
  let yPos = height - 120;
  const infoFields = [
    ['N° de Orden:', remisionData.no_orden],
    ['Remisión:', remisionData.remision],
    ['Móvil:', remisionData.movil],
    ['Fecha:', formatDate(informeData.creado_en)]
  ];

  infoFields.forEach(([label, value]) => {
    page1.drawText(`${label} ${value}`, {
      x: 50,
      y: yPos,
      size: 12,
      font: font
    });
    yPos -= 20;
  });

  // Description
  yPos -= 20;
  page1.drawText('DESCRIPCIÓN DE TRABAJOS REALIZADOS:', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont
  });

  yPos -= 30;
  const descriptionLines = wrapText(informeData.descripcion_trabajos, 65);
  descriptionLines.forEach(line => {
    page1.drawText(line, {
      x: 50,
      y: yPos,
      size: 11,
      font: font
    });
    yPos -= 18;
  });

  // Observations if any
  if (informeData.observaciones && informeData.observaciones.trim()) {
    yPos -= 20;
    page1.drawText('OBSERVACIONES:', {
      x: 50,
      y: yPos,
      size: 14,
      font: boldFont
    });

    yPos -= 25;
    const observationLines = wrapText(informeData.observaciones, 65);
    observationLines.forEach(line => {
      page1.drawText(line, {
        x: 50,
        y: yPos,
        size: 11,
        font: font
      });
      yPos -= 18;
    });
  }

  // Add photos pages
  if (informeData.fotos_antes && informeData.fotos_antes.length > 0) {
    await addPhotosPage(pdfDoc, informeData.fotos_antes, 'FOTOS ANTES');
  }

  if (informeData.fotos_despues && informeData.fotos_despues.length > 0) {
    await addPhotosPage(pdfDoc, informeData.fotos_despues, 'FOTOS DESPUÉS');
  }
};

/**
 * Add a page with photos
 */
const addPhotosPage = async (pdfDoc, photos, title) => {
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Title
  page.drawText(title, {
    x: 50,
    y: height - 60,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0.8)
  });

  // Add up to 4 photos per page (2x2 grid)
  let photoIndex = 0;
  const photoWidth = 220;
  const photoHeight = 160;
  const margin = 50;
  const spacing = 20;

  for (let row = 0; row < 2 && photoIndex < photos.length; row++) {
    for (let col = 0; col < 2 && photoIndex < photos.length; col++) {
      const photo = photos[photoIndex];
      
      try {
        const imageBytes = await fetchImageFromURL(photo.url);
        let image;
        
        // Try to embed as PNG first, then JPEG
        try {
          image = await pdfDoc.embedPng(imageBytes);
        } catch {
          image = await pdfDoc.embedJpg(imageBytes);
        }

        const x = margin + col * (photoWidth + spacing);
        const y = height - 150 - row * (photoHeight + spacing + 30);

        page.drawImage(image, {
          x,
          y,
          width: photoWidth,
          height: photoHeight
        });

        // Add photo caption
        page.drawText(`${photo.nombre || `Foto ${photoIndex + 1}`}`, {
          x,
          y: y - 15,
          size: 9,
          font: await pdfDoc.embedFont(StandardFonts.Helvetica),
          color: rgb(0.3, 0.3, 0.3)
        });

      } catch (error) {
        console.error(`Error embedding photo ${photoIndex}:`, error);
        // Add placeholder rectangle
        page.drawRectangle({
          x: margin + col * (photoWidth + spacing),
          y: height - 150 - row * (photoHeight + spacing + 30),
          width: photoWidth,
          height: photoHeight,
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 1
        });
      }

      photoIndex++;
    }
  }

  // If there are more photos, create additional pages
  if (photoIndex < photos.length) {
    await addPhotosPage(pdfDoc, photos.slice(photoIndex), title + ' (Cont.)');
  }
};

/**
 * Add image to PDF as a page
 */
const addImageToPDF = async (pdfDoc, imageUrl, title) => {
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  try {
    const imageBytes = await fetchImageFromURL(imageUrl);
    let image;
    
    try {
      image = await pdfDoc.embedPng(imageBytes);
    } catch {
      image = await pdfDoc.embedJpg(imageBytes);
    }

    // Calculate dimensions to fit page while maintaining aspect ratio
    const imgDims = image.scale(1);
    const scale = Math.min((width - 100) / imgDims.width, (height - 150) / imgDims.height);
    
    const scaledWidth = imgDims.width * scale;
    const scaledHeight = imgDims.height * scale;
    
    // Center the image
    const x = (width - scaledWidth) / 2;
    const y = (height - scaledHeight) / 2;

    page.drawImage(image, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight
    });

    // Add title
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    page.drawText(title, {
      x: 50,
      y: height - 50,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0.8)
    });

  } catch (error) {
    console.error('Error adding image to PDF:', error);
    await addErrorPage(pdfDoc, `Error cargando ${title}`, error.message);
  }
};

/**
 * Add placeholder page for missing content
 */
const addPlaceholderPage = async (pdfDoc, title, message) => {
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText(title, {
    x: 50,
    y: height - 200,
    size: 20,
    font: boldFont,
    color: rgb(0.6, 0.6, 0.6)
  });

  const messageLines = wrapText(message, 60);
  let yPos = height - 250;
  
  messageLines.forEach(line => {
    page.drawText(line, {
      x: 50,
      y: yPos,
      size: 12,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });
    yPos -= 20;
  });
};

/**
 * Add error page when content fails to load
 */
const addErrorPage = async (pdfDoc, title, errorMessage) => {
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText(title, {
    x: 50,
    y: height - 200,
    size: 18,
    font: boldFont,
    color: rgb(0.8, 0, 0)
  });

  page.drawText('Error:', {
    x: 50,
    y: height - 240,
    size: 14,
    font: boldFont,
    color: rgb(0.6, 0, 0)
  });

  const errorLines = wrapText(errorMessage, 60);
  let yPos = height - 270;
  
  errorLines.forEach(line => {
    page.drawText(line, {
      x: 50,
      y: yPos,
      size: 11,
      font: font,
      color: rgb(0.5, 0, 0)
    });
    yPos -= 18;
  });
};

// Utility functions

const fetchPDFFromURL = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status}`);
  }
  return await response.arrayBuffer();
};

const fetchImageFromURL = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  return await response.arrayBuffer();
};

const getLatestInforme = async (remisionId) => {
  try {
    const informesRef = collection(db, 'remisiones', remisionId, 'informesTecnicos');
    const q = query(informesRef, orderBy('creado_en', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting latest informe:', error);
    return null;
  }
};

const wrapText = (text, maxCharsPerLine) => {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
};

const formatDate = (date) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('es-ES');
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount || 0);
};

/**
 * Generate PDF for informe técnico only (used by useInformeConsolidado)
 */
export const generateInformePDF = async ({ informeData, remisionData }) => {
  const pdfDoc = await PDFDocument.create();
  await generateInformeTecnicoPages(pdfDoc, informeData, remisionData);
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};