import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  FileText, 
  Search,
  Upload,
  X,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle2,
  Camera
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp,
  updateDoc,
  doc
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
import ActividadesRealizadas from './ActividadesRealizadas';

// CORREGIDO: Componentes externos para evitar re-renders
const FileUploader = React.memo(({ onFilesSelected, label, tipo }) => {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id={`upload-${tipo}`}
      />
      <label htmlFor={`upload-${tipo}`} className="cursor-pointer">
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 10MB</p>
      </label>
    </div>
  );
});

const ImageGallery = React.memo(({ imagenes, tipo, onEliminar }) => (
  <div className="grid grid-cols-2 gap-4 mt-4">
    {imagenes.map((imagen, index) => (
      <div key={index} className="relative">
        <img
          src={imagen.url}
          alt={`${tipo} ${index + 1}`}
          className="w-full h-32 object-cover rounded-lg border"
        />
        <button
          onClick={() => onEliminar(imagen, tipo)}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
));

// Asignar displayNames para debugging
FileUploader.displayName = 'FileUploader';
ImageGallery.displayName = 'ImageGallery';

/**
 * 📋 FORMULARIO DE INFORMES TÉCNICOS - VERSIÓN INTEGRADA
 * =====================================================
 * 
 * ✅ TODO EN UN SOLO ARCHIVO CON PROPS:
 * - Búsqueda de remisiones
 * - Formulario completo
 * - Subida de imágenes
 * - Generación de PDF
 * - Guardado en Firestore
 * - Validaciones
 * - Integración con otros módulos via props
 */

const FormularioInforme = ({
  remisionPrecargada = null,
  autoGenerarPDF = false,
  informe = null,
  onGuardadoExitoso,
  onError
}) => {
  const { user } = useAuth();

  // Estados principales del formulario - CORREGIDO: inicialización segura con strings vacíos
  const [formData, setFormData] = useState({
    numeroRemision: '',
    remisionEncontrada: null,
    movil: '',
    tituloTrabajo: '',
    tecnico: '',
    fechaRemision: '',
    autorizo: '',
    une: '',
    subtotal: '',
    total: '',
    observacionesTecnicas: ''
  });

  // Estados para imágenes - CORREGIDO: inicializados como arrays vacíos
  const [imagenesAntes, setImagenesAntes] = useState([]);
  const [imagenesDespues, setImagenesDespues] = useState([]);

  // Estado para materiales adicionales de actividades
  const [materialesActividades, setMaterialesActividades] = useState([]);
  
  // NUEVO: Estado para datos consolidados de actividades (para PDF)
  const [datosConsolidadosActividades, setDatosConsolidadosActividades] = useState(null);

  // Estados de control - CORREGIDO: inicializados con valores seguros
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [validaciones, setValidaciones] = useState({});
  
  // CRÍTICO: Estado calculado para validación del formulario (evita re-renders)
  const [formularioCompleto, setFormularioCompleto] = useState(false);

  // CORREGIDO: Función auxiliar para buscar remisión estabilizada con useCallback
  const buscarRemisionPorNumero = useCallback(async (numeroRemision) => {
    try {
      const q = query(
        collection(db, 'remisiones'),
        where('remision', '==', String(numeroRemision).trim())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const remisionDoc = querySnapshot.docs[0];
        const remisionData = remisionDoc.data();
        
        setFormData(prev => ({
          ...prev,
          remisionEncontrada: remisionData,
          movil: String(remisionData.movil || ''),
          tituloTrabajo: String(remisionData.descripcion || prev.tituloTrabajo || ''),
          tecnico: String(remisionData.tecnico || ''),
          fechaRemision: String(remisionData.fecha_remision || ''),
          autorizo: String(remisionData.autorizo || ''),
          une: String(remisionData.une || ''),
          subtotal: String(remisionData.subtotal || ''),
          total: String(remisionData.total || '')
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error buscando remisión:', error);
      return false;
    }
  }, []); // Sin dependencias porque no usa variables externas

  // CORREGIDO: Función para mostrar mensajes estabilizada
  const mostrarMensaje = useCallback((tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
    
    // Callback para el componente padre
    if (tipo === 'error' && onError) {
      onError(texto);
    }
  }, [onError]);

  // --- CORREGIDO: Precargar datos si vienen de otro módulo (remisión) ---
  useEffect(() => {
    if (remisionPrecargada) {
      console.log('🔄 Precargando remisión:', remisionPrecargada);
      const remisionStr = String(remisionPrecargada || '');
      
      setFormData(prev => ({
        ...prev,
        numeroRemision: remisionStr,
        tituloTrabajo: `Informe técnico - Remisión ${remisionStr}`
      }));
      
      // Buscar automáticamente la remisión
      buscarRemisionPorNumero(remisionStr);
    }
  }, [remisionPrecargada, buscarRemisionPorNumero]); // CORREGIDO: dependencias explícitas

  // --- CORREGIDO: Precargar datos si estamos editando ---
  useEffect(() => {
    if (informe) {
      console.log('📝 Cargando informe para editar:', informe);
      setFormData({
        numeroRemision: String(informe.numeroRemision || ''),
        remisionEncontrada: informe.remisionEncontrada || null,
        movil: String(informe.movil || ''),
        tituloTrabajo: String(informe.tituloTrabajo || ''),
        tecnico: String(informe.tecnico || ''),
        fechaRemision: String(informe.fechaRemision || ''),
        autorizo: String(informe.autorizo || ''),
        une: String(informe.une || ''),
        subtotal: String(informe.subtotal || ''),
        total: String(informe.total || ''),
        observacionesTecnicas: String(informe.observacionesTecnicas || '')
      });
      
      if (informe.imagenesAntes && Array.isArray(informe.imagenesAntes)) {
        setImagenesAntes(informe.imagenesAntes);
      }
      if (informe.imagenesDespues && Array.isArray(informe.imagenesDespues)) {
        setImagenesDespues(informe.imagenesDespues);
      }
    }
  }, [informe]); // CORREGIDO: solo depende de 'informe'

  // CORREGIDO: Función para buscar remisión manual estabilizada
  const buscarRemision = useCallback(async () => {
    const numeroRemision = String(formData.numeroRemision || '').trim();
    
    if (!numeroRemision) {
      mostrarMensaje('error', 'Ingrese un número de remisión');
      return;
    }

    setLoading(true);
    try {
      const encontrada = await buscarRemisionPorNumero(numeroRemision);
      
      if (encontrada) {
        mostrarMensaje('success', '✅ Remisión encontrada y datos cargados');
      } else {
        mostrarMensaje('error', '❌ No se encontró la remisión');
        setFormData(prev => ({ ...prev, remisionEncontrada: null }));
      }
    } catch (error) {
      console.error('Error buscando remisión:', error);
      mostrarMensaje('error', 'Error al buscar la remisión');
    } finally {
      setLoading(false);
    }
  }, [formData.numeroRemision, buscarRemisionPorNumero, mostrarMensaje]); // CORREGIDO: dependencias explícitas

  // CORREGIDO: Función para subir imagen estabilizada
  const subirImagen = useCallback(async (file, tipo) => {
    const numeroRemision = String(formData.numeroRemision || '').trim();
    
    if (!numeroRemision) {
      mostrarMensaje('error', 'Primero busque una remisión');
      return null;
    }

    try {
      const timestamp = Date.now();
      const fileName = `${numeroRemision}_${tipo}_${timestamp}_${file.name}`;
      const storageRef = ref(storage, `informes/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      return {
        url,
        name: file.name,
        storageRef: fileName,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      mostrarMensaje('error', 'Error al subir la imagen');
      return null;
    }
  }, [formData.numeroRemision, mostrarMensaje]); // CORREGIDO: dependencias explícitas

  // CORREGIDO: Manejar subida de archivos ANTES estabilizada
  const handleImagenesAntes = useCallback(async (files) => {
    const nuevasImagenes = [];
    for (const file of files) {
      const imagen = await subirImagen(file, 'antes');
      if (imagen) nuevasImagenes.push(imagen);
    }
    setImagenesAntes(prev => [...prev, ...nuevasImagenes]);
  }, [subirImagen]); // CORREGIDO: dependencia de subirImagen

  // CORREGIDO: Manejar subida de archivos DESPUÉS estabilizada
  const handleImagenesDespues = useCallback(async (files) => {
    const nuevasImagenes = [];
    for (const file of files) {
      const imagen = await subirImagen(file, 'despues');
      if (imagen) nuevasImagenes.push(imagen);
    }
    setImagenesDespues(prev => [...prev, ...nuevasImagenes]);
  }, [subirImagen]); // CORREGIDO: dependencia de subirImagen

  // CORREGIDO: Eliminar imagen estabilizada
  const eliminarImagen = useCallback(async (imagen, tipo) => {
    try {
      const storageRef = ref(storage, `informes/${imagen.storageRef}`);
      await deleteObject(storageRef);
      
      if (tipo === 'antes') {
        setImagenesAntes(prev => prev.filter(img => img.storageRef !== imagen.storageRef));
      } else {
        setImagenesDespues(prev => prev.filter(img => img.storageRef !== imagen.storageRef));
      }
      
      mostrarMensaje('success', 'Imagen eliminada');
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      mostrarMensaje('error', 'Error al eliminar la imagen');
    }
  }, [mostrarMensaje]); // CORREGIDO: dependencia de mostrarMensaje

  // CORREGIDO: Validar formulario estabilizada para evitar re-renders
  const validarFormulario = useCallback(() => {
    const errores = {};
    
    // CORREGIDO: Validación segura con String() para evitar errores de .trim()
    const numeroRemision = String(formData.numeroRemision || '').trim();
    const tituloTrabajo = String(formData.tituloTrabajo || '').trim();
    const tecnico = String(formData.tecnico || '').trim();
    const total = String(formData.total || '');
    
    if (!numeroRemision) errores.numeroRemision = 'Requerido';
    if (!tituloTrabajo) errores.tituloTrabajo = 'Requerido';
    if (!tecnico) errores.tecnico = 'Requerido';
    if (!total || parseFloat(total) <= 0) errores.total = 'Debe ser mayor a 0';
    
    const esValido = Object.keys(errores).length === 0;
    
    setValidaciones(errores);
    setFormularioCompleto(esValido); // CRÍTICO: Actualizar estado calculado
    
    return esValido;
  }, [formData.numeroRemision, formData.tituloTrabajo, formData.tecnico, formData.total]); // CORREGIDO: dependencias específicas

  // CRÍTICO: useEffect para validar automáticamente cuando cambien los datos
  useEffect(() => {
    validarFormulario();
  }, [validarFormulario]);

  // CORREGIDO: Generar PDF estabilizada
  const generarPDF = useCallback(async (soloPreview = false) => {
    if (!validarFormulario()) {
      mostrarMensaje('error', 'Complete todos los campos requeridos');
      return;
    }

    setGenerandoPDF(true);
    try {
      console.log('📄 FormularioInforme: Preparando datos para PDF');
      console.log('   >> datosConsolidadosActividades:', datosConsolidadosActividades);
      console.log('   >> materialesActividades:', materialesActividades);
      
      const datosInforme = {
        idInforme: informe?.idInforme || `INF-${formData.numeroRemision}-${Date.now()}`,
        remision: String(formData.numeroRemision || ''),
        movil: String(formData.movil || ''),
        tituloTrabajo: String(formData.tituloTrabajo || ''),
        tecnico: String(formData.tecnico || ''),
        autorizo: String(formData.autorizo || ''),
        une: String(formData.une || ''),
        fecha_remision: String(formData.fechaRemision || ''),
        subtotal: String(formData.subtotal || ''),
        total: String(formData.total || ''),
        observacionesTecnicas: String(formData.observacionesTecnicas || ''),
        materialesActividades, // NUEVO: Incluir materiales de actividades en PDF
        datosConsolidadosActividades, // NUEVO: Incluir datos consolidados para sección 3 del PDF
        imagenesAntes: imagenesAntes,
        imagenesDespues: imagenesDespues,
        datosRemision: {
          fecha_remision: String(formData.fechaRemision || ''),
          remision: String(formData.numeroRemision || '')
        }
      };

      console.log('📄 FormularioInforme: Objeto datosInforme completo:', datosInforme);

      const empleado = {
        nombre_completo: user?.displayName || user?.email || 'Usuario',
        nombre: user?.displayName || user?.email || 'Usuario'
      };

      if (soloPreview) {
        await previsualizarPDF(datosInforme, empleado);
        mostrarMensaje('success', '👁️ Vista previa generada');
      } else {
        await generarPDFInforme(datosInforme, {
          abrirEnNuevaVentana: true,
          nombreArchivo: `Informe_Tecnico_${String(formData.numeroRemision || 'sin_numero')}.pdf`,
          currentEmployee: empleado
        });
        mostrarMensaje('success', '📄 PDF generado exitosamente');
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      mostrarMensaje('error', 'Error al generar PDF: ' + error.message);
    } finally {
      setGenerandoPDF(false);
    }
  }, [validarFormulario, mostrarMensaje, informe, formData, imagenesAntes, imagenesDespues, user, materialesActividades, datosConsolidadosActividades]); // ACTUALIZADO: incluir nuevos estados

  // CORREGIDO: Guardar informe estabilizada
  const guardarInforme = useCallback(async () => {
    if (!validarFormulario()) {
      mostrarMensaje('error', 'Complete todos los campos requeridos');
      return;
    }

    setGuardando(true);
    try {
      const informeData = {
        ...formData,
        imagenesAntes,
        imagenesDespues,
        materialesActividades, // NUEVO: Incluir materiales de actividades
        datosConsolidadosActividades, // NUEVO: Incluir datos consolidados para recuperación
        idInforme: informe?.idInforme || `INF-${formData.numeroRemision}-${Date.now()}`,
        creadoEn: informe?.creadoEn || serverTimestamp(),
        modificadoEn: serverTimestamp(),
        elaboradoPor: user?.email || 'usuario',
        estado: 'completado'
      };

      if (informe?.id) {
        // Actualizar informe existente
        await updateDoc(doc(db, 'informesTecnicos', informe.id), informeData);
        mostrarMensaje('success', '✅ Informe actualizado exitosamente');
      } else {
        // Crear nuevo informe
        const docRef = await addDoc(collection(db, 'informesTecnicos'), informeData);
        informeData.id = docRef.id;
        mostrarMensaje('success', '✅ Informe guardado exitosamente');
      }
      
      // Callback para el componente padre
      if (onGuardadoExitoso) {
        onGuardadoExitoso(informeData);
      }
      
      // Solo limpiar si es un nuevo informe
      if (!informe) {
        setFormData({
          numeroRemision: '',
          remisionEncontrada: null,
          movil: '', tituloTrabajo: '', tecnico: '', fechaRemision: '',
          autorizo: '', une: '', subtotal: '', total: '', observacionesTecnicas: ''
        });
        setImagenesAntes([]);
        setImagenesDespues([]);
        setValidaciones({});
      }
      
    } catch (error) {
      console.error('Error guardando informe:', error);
      mostrarMensaje('error', 'Error al guardar el informe');
    } finally {
      setGuardando(false);
    }
  }, [validarFormulario, mostrarMensaje, formData, imagenesAntes, imagenesDespues, informe, user, onGuardadoExitoso, materialesActividades, datosConsolidadosActividades]); // ACTUALIZADO: incluir nuevos estados

  // CORREGIDO: Handlers de onChange seguros para prevenir re-renders
  const handleInputChange = useCallback((field) => (e) => {
    const value = String(e.target.value || ''); // CORREGIDO: siempre string
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []); // Sin dependencias, es un handler puro

  // Handler para recibir cambios de materiales desde ActividadesRealizadas
  const handleMaterialesChange = useCallback((materiales) => {
    setMaterialesActividades(materiales);
  }, []);

  // NUEVO: Handler para recibir datos consolidados de actividades (para PDF)
  const handleDatosConsolidadosChange = useCallback((datosConsolidados) => {
    console.log('📋 FormularioInforme: Recibiendo datos consolidados de ActividadesRealizadas:', datosConsolidados);
    setDatosConsolidadosActividades(datosConsolidados);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FileText className="w-8 h-8 text-blue-600 mr-3" />
          {informe ? 'Editar Informe Técnico' : 'Nuevo Informe Técnico'}
        </h2>
        <p className="text-gray-600 mt-2">
          {informe ? 'Modifique los campos necesarios' : 'Complete todos los campos para generar el informe'}
        </p>
      </div>

      {/* Mensajes */}
      {mensaje.texto && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg border ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center">
            {mensaje.tipo === 'success' ? (
              <CheckCircle2 className="w-5 h-5 mr-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 mr-2" />
            )}
            {mensaje.texto}
          </div>
        </motion.div>
      )}

      {/* Sección 1: Búsqueda de Remisión */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Search className="w-5 h-5 mr-2 text-blue-600" />
          1. Datos de Remisión
        </h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={String(formData.numeroRemision || '')}
              onChange={handleInputChange('numeroRemision')}
              placeholder="Número de remisión (ej: 20240101)"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                validaciones.numeroRemision ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validaciones.numeroRemision && (
              <p className="text-red-500 text-sm mt-1">{validaciones.numeroRemision}</p>
            )}
          </div>
          <button
            onClick={buscarRemision}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        
        {formData.remisionEncontrada && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">✅ Remisión encontrada - Datos cargados automáticamente</p>
          </div>
        )}
      </div>

      {/* Sección 2: Datos del Trabajo */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">2. Datos del Trabajo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Móvil</label>
            <input
              type="text"
              value={String(formData.movil || '')}
              onChange={handleInputChange('movil')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="text"
              value={String(formData.fechaRemision || '')}
              onChange={handleInputChange('fechaRemision')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Título del Trabajo *</label>
            <input
              type="text"
              value={String(formData.tituloTrabajo || '')}
              onChange={handleInputChange('tituloTrabajo')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                validaciones.tituloTrabajo ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Reparación de carrocería"
            />
            {validaciones.tituloTrabajo && (
              <p className="text-red-500 text-sm mt-1">{validaciones.tituloTrabajo}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Técnico *</label>
            <input
              type="text"
              value={String(formData.tecnico || '')}
              onChange={handleInputChange('tecnico')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                validaciones.tecnico ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validaciones.tecnico && (
              <p className="text-red-500 text-sm mt-1">{validaciones.tecnico}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total *</label>
            <input
              type="number"
              value={String(formData.total || '')}
              onChange={handleInputChange('total')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                validaciones.total ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validaciones.total && (
              <p className="text-red-500 text-sm mt-1">{validaciones.total}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sección 3: Actividades Realizadas */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">3. Actividades Realizadas</h3>
        <ActividadesRealizadas
          tituloTrabajo={formData.tituloTrabajo}
          onMaterialesChange={handleMaterialesChange}
          onDatosConsolidadosChange={handleDatosConsolidadosChange}
        />
      </div>

      {/* Sección 4: Evidencias Fotográficas */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Camera className="w-5 h-5 mr-2 text-blue-600" />
          4. Evidencias Fotográficas
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Imágenes ANTES */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">📸 ANTES ({imagenesAntes.length})</h4>
            <FileUploader
              onFilesSelected={handleImagenesAntes}
              label="Subir fotos ANTES"
              tipo="antes"
            />
            <ImageGallery
              imagenes={imagenesAntes}
              tipo="antes"
              onEliminar={eliminarImagen}
            />
          </div>

          {/* Imágenes DESPUÉS */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">📸 DESPUÉS ({imagenesDespues.length})</h4>
            <FileUploader
              onFilesSelected={handleImagenesDespues}
              label="Subir fotos DESPUÉS"
              tipo="despues"
            />
            <ImageGallery
              imagenes={imagenesDespues}
              tipo="despues"
              onEliminar={eliminarImagen}
            />
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200">
        <button
          onClick={() => generarPDF(true)}
          disabled={generandoPDF || loading}
          className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          <Eye className="w-4 h-4" />
          {generandoPDF ? 'Generando...' : 'Vista Previa PDF'}
        </button>

        <button
          onClick={() => generarPDF(false)}
          disabled={generandoPDF || loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {generandoPDF ? 'Generando...' : 'Generar PDF'}
        </button>

        <button
          onClick={guardarInforme}
          disabled={guardando || loading}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {guardando ? 'Guardando...' : (informe ? 'Actualizar' : 'Guardar')}
        </button>
      </div>

      {/* Resumen del Estado */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Estado del formulario:</span>
          <div className="flex items-center gap-4">
            <span>Evidencias: {imagenesAntes.length + imagenesDespues.length}</span>
            <span className={`font-medium ${
              formularioCompleto ? 'text-green-600' : 'text-amber-600'
            }`}>
              {formularioCompleto ? '✅ Completo' : '⚠️ Incompleto'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioInforme;
