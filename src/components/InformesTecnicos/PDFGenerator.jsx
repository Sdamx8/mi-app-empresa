import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { generarPDFInforme } from '../../services/pdf';

const PDFGenerator = ({ informeData, isPreview = false, onClose }) => {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  // Resolver nombre del elaborador (lookup en EMPLEADOS)
  const resolverNombreElaborador = async (correo) => {
    if (!correo || !String(correo).includes('@')) return correo || 'N/A';
    try {
      const colRef = collection(db, 'EMPLEADOS');
      const q = query(colRef, where('correo', '==', correo));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        return data?.nombre_completo || correo;
      }
      return correo;
    } catch (e) {
      console.warn('resolverNombreElaborador error:', e);
      return correo || 'N/A';
    }
  };

  // Normalizar número de móvil (prefijo Z70-)
  const normalizarMovil = (valor) => {
    if (!valor) return 'N/A';
    const s = String(valor).trim();
    if (s.startsWith('Z70-') || s.startsWith('BO-')) return s;
    return `Z70-${s}`;
  };

  // Construir descripcionConsolidada a partir de datosConsolidados
  const buildDescripcionConsolidada = (datosConsolidados) => {
    if (!datosConsolidados || !Array.isArray(datosConsolidados.descripciones) || datosConsolidados.descripciones.length === 0) {
      return null;
    }

    // Unir descripciones sin numeración extra
    const texto = datosConsolidados.descripciones
      .map(desc => String(desc).trim())
      .filter(Boolean)
      .join('\n\n'); // separa por doble salto de línea

    const mats = (datosConsolidados.materiales || []).join(', ') || 'No especificado';
    const recs = (datosConsolidados.recursos || []).join(', ') || 'No especificado';
    const tiempo = datosConsolidados.tiempoTotal
      ? `${datosConsolidados.tiempoTotal.horas ? datosConsolidados.tiempoTotal.horas + 'h ' : ''}${datosConsolidados.tiempoTotal.minutos ?? 0}m`
      : 'No especificado';

    return `${texto}\n\nMateriales suministrados: ${mats}\nRecurso humano requerido: ${recs}\nTiempo estimado: ${tiempo}`;
  };

  // Preparar datos del informe para el generador de PDF
  const prepararDatosInforme = async () => {
    if (!informeData) return null;

    // Obtener nombre del elaborador
    const correoElaborador = informeData.creadoPor || informeData.elaboradoPor || 
      (informeData.currentEmployee && informeData.currentEmployee.email) || 
      (informeData.currentEmployee && informeData.currentEmployee.correo);
    
    const nombreElaborador = await resolverNombreElaborador(correoElaborador);

    // Consolidar actividades
    const datosConsolidados = informeData.datosConsolidadosActividades || informeData.actividadesConsolidadas || null;
    const descripcionConsolidada = datosConsolidados ? buildDescripcionConsolidada(datosConsolidados) : null;

    // Estructura de datos esperada por el generador de PDF
    return {
      // Información básica del informe
      idInforme: informeData.idInforme || informeData.numeroRemision || `INF-${informeData.remision}-${Date.now()}`,
      numeroRemision: informeData.remision || informeData.numeroRemision || 'No especificada',
      fechaElaboracion: new Date(),
      elaboradoPor: nombreElaborador,
      
      // Datos de la remisión
      datosRemision: {
        remision: informeData.numeroRemision || informeData.remision || 'N/A',
        movil: normalizarMovil(informeData.movil || informeData.remisionData?.movil || informeData.remision?.movil),
        descripcion: informeData.remisionData?.descripcion || 'N/A',
        tecnico: informeData.remisionData?.tecnico || 'N/A',
        fecha_remision: informeData.fecha_remision || informeData.fechaRemision || 'No registrada',
        autorizo: informeData.remisionData?.autorizo || 'N/A',
        une: informeData.remisionData?.une || 'N/A',
        subtotal: informeData.subtotal || informeData.datosRemision?.subtotal || informeData.remisionData?.subtotal || 0,
        total: informeData.total || informeData.datosRemision?.total || informeData.remisionData?.total || 0
      },
      
      // Datos consolidados de actividades
      datosConsolidadosActividades: datosConsolidados,
      descripcionConsolidada,
      
      // Observaciones técnicas
      observacionesTecnicas: informeData.observaciones || 'No se registraron observaciones técnicas.',
      
      // Imágenes (convertir evidencias a formato esperado)
      imagenesAntes: informeData.imagenesAntes || informeData.evidencias?.filter(ev => ev.tipo === 'antes') || [],
      imagenesDespues: informeData.imagenesDespues || informeData.evidencias?.filter(ev => ev.tipo === 'despues') || [],
      
      // Totales para compatibilidad
      subtotal: informeData.subtotal || informeData.datosRemision?.subtotal || informeData.remisionData?.subtotal || 0,
      total: informeData.total || informeData.datosRemision?.total || informeData.remisionData?.total || 0
    };
  };

  const generarPDF = async () => {
    setGenerando(true);
    setError(null);
    setExito(false);

    try {
      console.log('🚀 Iniciando generación de PDF...');
      
      const datosPreparados = await prepararDatosInforme();
      if (!datosPreparados) {
        throw new Error('No se pudieron preparar los datos del informe');
      }

      console.log('📋 Datos preparados para PDF:', datosPreparados);
      
      // Llamar al servicio de generación de PDF
      const resultado = await generarPDFInforme(datosPreparados, {
        abrirEnNuevaVentana: true,
        incluirLogo: true,
        currentEmployee: informeData.currentEmployee
      });
      
      if (resultado) {
        setExito(true);
        console.log('✅ PDF generado exitosamente');
        
        // Auto-cerrar después de 3 segundos si es modo preview
        if (isPreview && onClose) {
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      }
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      setError(error.message || 'Error desconocido al generar el PDF');
    } finally {
      setGenerando(false);
    }
  };

  // Generar automáticamente si no es modo preview
  useEffect(() => {
    if (!isPreview) {
      generarPDF();
    }
  }, [isPreview]);

  if (!informeData) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg max-w-2xl w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {isPreview ? 'Vista Previa PDF' : 'Generar PDF'}
              </h3>
              <p className="text-sm text-gray-600">
                Informe: {informeData.idInforme || informeData.numeroRemision || 'N/A'}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Resumen del informe */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Resumen del Informe</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Remisión:</span>
              <span className="ml-2 font-medium">{informeData.numeroRemision || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Técnico:</span>
              <span className="ml-2 font-medium">{informeData.remisionData?.tecnico || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Móvil:</span>
              <span className="ml-2 font-medium">{informeData.remisionData?.movil || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Evidencias:</span>
              <span className="ml-2 font-medium">{informeData.evidencias?.length || 0} imágenes</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Fecha de Remisión:</span>
              <span className="ml-2 font-medium">{informeData.remisionData?.fecha_remision || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Estados de la generación */}
        {generando && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Generando PDF...</h4>
              <p className="text-sm text-gray-600">
                Por favor espera mientras se procesa el documento con las evidencias fotográficas.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">Error al generar PDF</h4>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  💡 Sugerencia: Verifica que las imágenes sean accesibles y que el navegador permita descargas.
                </p>
              </div>
            </div>
          </div>
        )}

        {exito && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-green-800 mb-1">PDF generado exitosamente</h4>
                <p className="text-sm text-green-700">
                  El archivo PDF ha sido generado y descargado automáticamente.
                </p>
                {isPreview && (
                  <p className="text-xs text-green-600 mt-2">
                    Esta ventana se cerrará automáticamente en unos segundos...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          {isPreview && (
            <button
              onClick={generarPDF}
              disabled={generando}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200
                ${generando
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              `}
            >
              <Download className="w-4 h-4" />
              {generando ? 'Generando...' : 'Generar y Descargar PDF'}
            </button>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              {exito ? 'Cerrar' : 'Cancelar'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PDFGenerator;
