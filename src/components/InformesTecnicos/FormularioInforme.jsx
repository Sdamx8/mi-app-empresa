import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { useAuth } from '../../AuthContext';
import { generarPDFInforme, previsualizarPDF } from '../../services/pdf';
import { obtenerParametrosURL, limpiarParametrosURL } from '../../services/integracionModulos';

/**
 * 📋 FORMULARIO DE INFORMES TÉCNICOS - VERSIÓN INTEGRADA
 * =====================================================
 * 
 * ✅ CARACTERÍSTICAS IMPLEMENTADAS:
 * - Integración completa con servicio PDF corregido
 * - Separación de evidencias ANTES y DESPUÉS
 * - Auto-carga de remisiones desde URL params
 * - Generación directa de PDF sin componentes intermedios
 * - Validación completa de formulario
 * - Estructura de datos compatible con el servicio PDF refactorizado
 * 
 * ✅ FLUJO COMPLETO:
 * 1. Buscar remisión por número
 * 2. Completar observaciones técnicas
 * 3. Subir evidencias fotográficas (ANTES/DESPUÉS)
 * 4. Generar PDF con todas las secciones corregidas
 * 5. Guardar informe en Firestore
 */

const FormularioInforme = () => {
  // Estados principales
  const [numeroRemision, setNumeroRemision] = useState('');
  const [remisionData, setRemisionData] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [imagenesAntes, setImagenesAntes] = useState([]);
  const [imagenesDespues, setImagenesDespues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [tipoImagen, setTipoImagen] = useState('antes'); // 'antes' o 'despues'

  const { user } = useAuth();

  // ✅ NUEVA FUNCIONALIDAD: Detectar parámetros URL al cargar
  useEffect(() => {
    const params = obtenerParametrosURL();
    console.log('📍 Parámetros URL detectados:', params);
    
    if (params.remision) {
      console.log('🔄 Auto-cargando remisión desde URL:', params.remision);
      setNumeroRemision(params.remision);
      
      // Buscar automáticamente la remisión
      const buscarAutomatico = async () => {
        if (!numeroRemision) { // Solo si no hay ya una remisión cargada
          await buscarRemisionPorNumero(params.remision);
          
          // Limpiar parámetros URL después de procesar
          limpiarParametrosURL();
        }
      };
      
      buscarAutomatico();
    }
  }, []);

  // Función separada para buscar remisión por número (reutilizable)
  const buscarRemisionPorNumero = async (numeroParam) => {
    const numero = numeroParam || numeroRemision;
    if (!numero.trim()) {
      setErrors({ numeroRemision: 'Ingrese un número de remisión' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const q = query(
        collection(db, 'remisiones'),
        where('remision', '==', numero.trim())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        
        // Procesar número de móvil
        let movil = data.movil || '';
        if (movil.startsWith('BO-')) {
          movil = movil.replace('BO-', '');
        }
        if (!movil.startsWith('Z70-')) {
          movil = `Z70-${movil}`;
        }

        // Generar ID del informe
        const fecha = new Date();
        const fechaFormat = fecha.toLocaleDateString('es-CO').replace(/\//g, '');
        const idInforme = `IT-${numero}-${fechaFormat}`;

        // CORRECCIÓN: Usar el campo 'remision' (string) de la colección como fecha y convertir a DD/MM/YYYY
        const fechaRemisionFormateada = parseAndFormatRemisionDate(String(data.remision || ''));

        const datosFormateados = {
          ...data,
          movil,
          idInforme,
          docId: doc.id,
          remision: numero.trim(), // Número de remisión
          tituloTrabajo: data.descripcion || 'No especificado', // Mapear descripcion a tituloTrabajo
          tecnico: data.tecnico || data.autorizo || 'No especificado', // Usar tecnico o autorizo
          autorizo: data.autorizo || 'No especificado',
          une: data.une || 'No especificado',
          subtotal: data.subtotal || '0',
          total: data.total || data.subtotal || '0',
          // Exponer el campo fecha_remision normalizado en formato DD/MM/YYYY
          fecha_remision: fechaRemisionFormateada,
          // Mantener el valor original del campo remision para referencia
          remision_original: data.remision
        };

        setRemisionData(datosFormateados);
        setNumeroRemision(numero.trim());
        
        console.log('✅ Remisión encontrada y procesada:', datosFormateados);
      } else {
        console.log('❌ No se encontró la remisión:', numero);
        setErrors({ numeroRemision: 'No se encontró una remisión con este número' });
        setRemisionData(null);
      }
    } catch (error) {
      console.error('Error al buscar remisión:', error);
      setErrors({ numeroRemision: 'Error al buscar la remisión' });
    } finally {
      setLoading(false);
    }
  };

  // Helper: parse remision string and return DD/MM/YYYY or original string as fallback
  const parseAndFormatRemisionDate = (remisionStr) => {
    if (!remisionStr) return 'No especificada';

    // Try direct Date parse (ISO or common formats)
    const tryDate = (s) => {
      const d = new Date(s);
      return isNaN(d) ? null : d;
    };

    let date = tryDate(remisionStr);

    // If direct parse failed, try patterns
    if (!date) {
      // Patterns: YYYYMMDD, DDMMYYYY, YYYY-MM-DD, DD/MM/YYYY
      const digitsOnly = remisionStr.replace(/[^0-9]/g, '');
      if (/^\d{8}$/.test(digitsOnly)) {
        // Could be YYYYMMDD or DDMMYYYY; try both
        const ymd = `${digitsOnly.slice(0,4)}-${digitsOnly.slice(4,6)}-${digitsOnly.slice(6,8)}`;
        date = tryDate(ymd) || null;
        if (!date) {
          const dmy = `${digitsOnly.slice(0,2)}-${digitsOnly.slice(2,4)}-${digitsOnly.slice(4,8)}`;
          date = tryDate(dmy) || null;
        }
      }

      // Try common separators (/, -, .)
      if (!date && /[\/\-.]/.test(remisionStr)) {
        const parts = remisionStr.split(/[\/\-.]/).map(p => p.trim());
        if (parts.length === 3) {
          // Heuristics: if first part length === 4 assume YYYY-MM-DD
          let candidate;
          if (parts[0].length === 4) candidate = `${parts[0]}-${parts[1]}-${parts[2]}`;
          else candidate = `${parts[2]}-${parts[1]}-${parts[0]}`; // assume DD/MM/YYYY -> YYYY-MM-DD
          date = tryDate(candidate) || null;
        }
      }
    }

    if (!date || isNaN(date)) return remisionStr; // return original if cannot parse

    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Función para buscar remisión optimizada con useCallback (wrapper)
  const buscarRemision = useCallback(async () => {
    await buscarRemisionPorNumero(numeroRemision);
  }, [numeroRemision]);

  // Configuración de dropzone para evidencias (ANTES y DESPUÉS separadas)
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 10,
    onDrop: async (acceptedFiles) => {
      setUploading(true);
      
      try {
        const uploadPromises = acceptedFiles.map(async (file) => {
          const fileName = `${Date.now()}-${file.name}`;
          const storageRef = ref(storage, `informes/${numeroRemision}/${tipoImagen}/${fileName}`);
          
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          
          return {
            id: Date.now() + Math.random(),
            name: file.name,
            url: downloadURL,
            storagePath: `informes/${numeroRemision}/${tipoImagen}/${fileName}`,
            tipo: tipoImagen
          };
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        
        // Agregar a la lista correspondiente según el tipo
        if (tipoImagen === 'antes') {
          setImagenesAntes(prev => [...prev, ...uploadedFiles]);
        } else {
          setImagenesDespues(prev => [...prev, ...uploadedFiles]);
        }
        
        console.log(`✅ ${uploadedFiles.length} imágenes ${tipoImagen.toUpperCase()} subidas exitosamente`);
      } catch (error) {
        console.error('Error al subir evidencias:', error);
        setErrors({ evidencias: 'Error al subir las imágenes' });
      } finally {
        setUploading(false);
      }
    }
  });

  // Eliminar evidencia optimizada with useCallback (actualizada para ANTES/DESPUÉS)
  const eliminarEvidencia = useCallback(async (evidencia) => {
    try {
      // Eliminar de Firebase Storage
      if (evidencia.storagePath) {
        const storageRef = ref(storage, evidencia.storagePath);
        await deleteObject(storageRef);
      }
      
      // Eliminar del estado local correspondiente
      if (evidencia.tipo === 'antes') {
        setImagenesAntes(prev => prev.filter(e => e.id !== evidencia.id));
      } else {
        setImagenesDespues(prev => prev.filter(e => e.id !== evidencia.id));
      }
      
      console.log(`🗑️ Evidencia ${evidencia.tipo.toUpperCase()} eliminada:`, evidencia.name);
    } catch (error) {
      console.error('Error al eliminar evidencia:', error);
    }
  }, []);

  // Validar formulario optimizada con useCallback (actualizada)
  const validarFormulario = useCallback(() => {
    const newErrors = {};
    
    if (!numeroRemision.trim()) {
      newErrors.numeroRemision = 'El número de remisión es obligatorio';
    }
    
    if (!remisionData) {
      newErrors.numeroRemision = 'Debe buscar una remisión válida';
    }
    
    if (!observaciones.trim()) {
      newErrors.observaciones = 'Las observaciones técnicas son obligatorias';
    }
    
    // Validar que haya al menos una evidencia (ANTES o DESPUÉS)
    const totalEvidencias = imagenesAntes.length + imagenesDespues.length;
    if (totalEvidencias === 0) {
      newErrors.evidencias = 'Debe subir al menos una evidencia fotográfica (ANTES o DESPUÉS)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [numeroRemision, remisionData, observaciones, imagenesAntes, imagenesDespues]);

  // Guardar informe optimizada con useCallback (actualizada)
  const guardarInforme = useCallback(async () => {
    if (!validarFormulario()) return;
    
    setLoading(true);
    
    try {
      const informeData = {
        idInforme: remisionData.idInforme,
        numeroRemision: numeroRemision,
        remisionData: remisionData,
        observacionesTecnicas: observaciones, // Cambio de nombre para consistencia
        imagenesAntes: imagenesAntes, // Evidencias ANTES separadas
        imagenesDespues: imagenesDespues, // Evidencias DESPUÉS separadas
        totalEvidencias: imagenesAntes.length + imagenesDespues.length,
        estado: 'Generado con éxito',
        creadoPor: user?.email || 'Usuario desconocido',
        fechaCreacion: serverTimestamp(),
        fechaModificacion: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'informesTecnicos'), informeData);
      
      console.log('✅ Informe guardado con ID:', docRef.id);
      
      // Limpiar formulario
      setNumeroRemision('');
      setRemisionData(null);
      setObservaciones('');
      setImagenesAntes([]);
      setImagenesDespues([]);
      setErrors({});
      
      alert('✅ Informe guardado exitosamente');
    } catch (error) {
      console.error('Error al guardar informe:', error);
      setErrors({ general: 'Error al guardar el informe' });
    } finally {
      setLoading(false);
    }
  }, [numeroRemision, remisionData, observaciones, imagenesAntes, imagenesDespues, user?.email, validarFormulario]);

  // ✅ NUEVA FUNCIÓN: Generar PDF usando el servicio corregido
  const generarPDF = useCallback(async (solo_preview = false) => {
    if (!validarFormulario()) {
      alert('⚠️ Complete todos los campos requeridos antes de generar el PDF');
      return;
    }

    setGenerandoPDF(true);
    
    try {
      // Estructurar datos exactamente como espera el servicio PDF
      const datosInforme = {
        // IDs y referencias
        idInforme: remisionData.idInforme,
        remision: numeroRemision,
        
        // Datos básicos de la remisión (ya procesados)
        movil: remisionData.movil,
        tituloTrabajo: remisionData.tituloTrabajo,
        tecnico: remisionData.tecnico,
        autorizo: remisionData.autorizo,
        une: remisionData.une,
        
        // Fecha de remisión ya formateada
        fecha_remision: remisionData.fecha_remision,
        datosRemision: {
          fecha_remision: remisionData.fecha_remision,
          remision: remisionData.remision_original
        },
        
        // Valores monetarios
        subtotal: remisionData.subtotal,
        total: remisionData.total,
        
        // Observaciones técnicas
        observacionesTecnicas: observaciones,
        
        // Imágenes en el formato esperado por el servicio PDF
        imagenesAntes: imagenesAntes,
        imagenesDespues: imagenesDespues
      };
      
      // Configuración del PDF
      const opciones = {
        abrirEnNuevaVentana: !solo_preview,
        nombreArchivo: `Informe_Tecnico_${numeroRemision}.pdf`,
        incluirLogo: true,
        currentEmployee: {
          nombre_completo: user?.displayName || user?.email || 'Usuario',
          nombre: user?.displayName || user?.email || 'Usuario'
        }
      };

      console.log('📄 Generando PDF con datos:', datosInforme);
      console.log('⚙️ Opciones PDF:', opciones);

      // Llamar al servicio PDF corregido
      if (solo_preview) {
        await previsualizarPDF(datosInforme, opciones.currentEmployee);
      } else {
        await generarPDFInforme(datosInforme, opciones);
      }
      
      console.log('✅ PDF generado exitosamente');
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      alert(`Error al generar PDF: ${error.message}`);
    } finally {
      setGenerandoPDF(false);
    }
  }, [validarFormulario, remisionData, numeroRemision, observaciones, imagenesAntes, imagenesDespues, user]);

  // Objeto de datos del informe memorizado (actualizado)
  // Objeto de datos del informe memorizado (actualizado)
  const informeData = useMemo(() => {
    if (!remisionData) return null;
    
    return {
      idInforme: remisionData.idInforme,
      numeroRemision: numeroRemision,
      remisionData: remisionData,
      observacionesTecnicas: observaciones,
      imagenesAntes: imagenesAntes,
      imagenesDespues: imagenesDespues,
      totalEvidencias: imagenesAntes.length + imagenesDespues.length
    };
  }, [remisionData, numeroRemision, observaciones, imagenesAntes, imagenesDespues]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Sección de búsqueda de remisión */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🔍 Buscar Remisión
        </h2>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Remisión
            </label>
            <input
              type="text"
              value={numeroRemision}
              onChange={(e) => setNumeroRemision(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 1529"
            />
            {errors.numeroRemision && (
              <p className="mt-1 text-sm text-red-600">{errors.numeroRemision}</p>
            )}
          </div>
          
          <div className="flex items-end">
            <button
              onClick={buscarRemision}
              disabled={loading || !numeroRemision.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Buscando...' : '🔍 Buscar'}
            </button>
          </div>
        </div>
      </div>

      {/* Datos de la remisión */}
      {remisionData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📋 Datos de la Remisión
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Informe
              </label>
              <input
                type="text"
                value={remisionData.idInforme}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número del Móvil
              </label>
              <input
                type="text"
                value={remisionData.movil}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del Trabajo
              </label>
              <input
                type="text"
                value={remisionData.descripcion || 'N/A'}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Técnico Asignado
              </label>
              <input
                type="text"
                value={remisionData.tecnico || 'N/A'}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Remisión
              </label>
              <input
                type="text"
                value={remisionData.fecha_remision || 'N/A'}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autorizado por
              </label>
              <input
                type="text"
                value={remisionData.autorizo || 'N/A'}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UNE
              </label>
              <input
                type="text"
                value={remisionData.une || 'N/A'}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtotal
              </label>
              <input
                type="text"
                value={`$${remisionData.subtotal || '0'}`}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total (incluye IVA si aplica)
              </label>
              <input
                type="text"
                value={`$${remisionData.total || '0'}`}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Observaciones técnicas */}
      {remisionData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📝 Observaciones Técnicas
          </h2>
          
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describa las observaciones técnicas del servicio realizado..."
          />
          {errors.observaciones && (
            <p className="mt-1 text-sm text-red-600">{errors.observaciones}</p>
          )}
        </motion.div>
      )}

      {/* Evidencias fotográficas */}
      {remisionData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📸 Evidencias Fotográficas
          </h2>
          
          {/* Selector de tipo de imagen */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de evidencia a subir:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="antes"
                  checked={tipoImagen === 'antes'}
                  onChange={(e) => setTipoImagen(e.target.value)}
                  className="mr-2"
                />
                📷 Imágenes ANTES
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="despues"
                  checked={tipoImagen === 'despues'}
                  onChange={(e) => setTipoImagen(e.target.value)}
                  className="mr-2"
                />
                📷 Imágenes DESPUÉS
              </label>
            </div>
          </div>
          
          {/* Dropzone para subir imágenes */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Subiendo imágenes {tipoImagen.toUpperCase()}...</p>
              </div>
            ) : (
              <div className="py-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  {isDragActive 
                    ? `Suelta las imágenes ${tipoImagen.toUpperCase()} aquí` 
                    : `Arrastra imágenes ${tipoImagen.toUpperCase()} o haz clic para seleccionar`
                  }
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
              </div>
            )}
          </div>
          
          {errors.evidencias && (
            <p className="mt-2 text-sm text-red-600">{errors.evidencias}</p>
          )}
          
          {/* Lista de evidencias ANTES */}
          {imagenesAntes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 text-green-700">
                📷 Imágenes ANTES ({imagenesAntes.length})
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagenesAntes.map((evidencia) => (
                  <div key={evidencia.id} className="relative group">
                    <img
                      src={evidencia.url}
                      alt={evidencia.name}
                      className="w-full h-32 object-cover rounded-lg border border-green-200"
                    />
                    <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                      ANTES
                    </div>
                    <button
                      onClick={() => eliminarEvidencia(evidencia)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Lista de evidencias DESPUÉS */}
          {imagenesDespues.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 text-blue-700">
                📷 Imágenes DESPUÉS ({imagenesDespues.length})
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagenesDespues.map((evidencia) => (
                  <div key={evidencia.id} className="relative group">
                    <img
                      src={evidencia.url}
                      alt={evidencia.name}
                      className="w-full h-32 object-cover rounded-lg border border-blue-200"
                    />
                    <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      DESPUÉS
                    </div>
                    <button
                      onClick={() => eliminarEvidencia(evidencia)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Resumen de evidencias */}
          {(imagenesAntes.length > 0 || imagenesDespues.length > 0) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                📊 Total evidencias: {imagenesAntes.length + imagenesDespues.length} 
                ({imagenesAntes.length} ANTES, {imagenesDespues.length} DESPUÉS)
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Botones de acción */}
      {remisionData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={() => generarPDF(true)}
              disabled={generandoPDF || !validarFormulario()}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generandoPDF ? '🔄 Generando...' : '👁️ Vista Previa PDF'}
            </button>
            
            <button
              onClick={() => generarPDF(false)}
              disabled={generandoPDF || !validarFormulario()}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generandoPDF ? '🔄 Generando...' : '📄 Generar PDF'}
            </button>
            
            <button
              onClick={guardarInforme}
              disabled={loading || !validarFormulario()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '💾 Guardando...' : '💾 Guardar Informe'}
            </button>
          </div>
          
          {errors.general && (
            <p className="mt-2 text-sm text-red-600">{errors.general}</p>
          )}
          
          {/* Información de estado del formulario */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              ✅ Estado del formulario: 
              {validarFormulario() ? ' Listo para generar PDF' : ' Complete los campos requeridos'}
            </p>
            {informeData && (
              <p className="text-xs text-blue-600 mt-1">
                📊 Evidencias: {informeData.totalEvidencias} | 
                📝 Observaciones: {observaciones.length} caracteres
              </p>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FormularioInforme;
