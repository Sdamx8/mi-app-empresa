// HerramientaElectrica.js - Módulo de administración de herramientas eléctricas con Firestore
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  serverTimestamp, 
  addDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../core/config/firebaseConfig';
import QRCode from 'qrcode';
import './HerramientaElectrica.css';

// Estados disponibles para herramientas
const ESTADOS_HERRAMIENTA = [
  { value: 'operativo', label: 'Operativo', bgColor: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-200' },
  { value: 'en_reparacion', label: 'En Reparación', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-200' },
  { value: 'dado_de_baja', label: 'Dado de Baja', bgColor: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-200' },
  { value: 'en_mantenimiento', label: 'En Mantenimiento', bgColor: 'bg-blue-100', textColor: 'text-blue-800', borderColor: 'border-blue-200' }
];

// Formulario inicial basado en campos de Firestore existentes
const initialToolForm = {
  id: '',
  description: '',
  estado: 'operativo',
  fabrication_date: '',
  fecha_inspeccion: '',
  purchase_date: '',
  machine_serial: '',
  internal_serial_number: '',
  invoice: '',
  tecnico: '',
  mantenimiento_correctivo: '',
  mantenimiento_preventivo: '',
  persona_inspeccion: '',
  persona_mantenimiento: '',
  lugar: '',
  foto_url: ''
};

const HerramientaElectrica = () => {
  // Estados principales
  const [tools, setTools] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [editingTool, setEditingTool] = useState(null);
  
  // Estados de UI
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [showToolForm, setShowToolForm] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'cards', 'table'
  
  // Estados de formularios
  const [toolForm, setToolForm] = useState(initialToolForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [qrCodes, setQrCodes] = useState({});
  
  // Estados de filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');

  // ============================
  // FUNCIONES DE UTILIDAD
  // ============================

  // Mostrar mensajes con auto-hide
  const showMessage = useCallback((msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  }, []);

  // Generar código QR
  const generateQRCode = useCallback(async (toolSerial) => {
    if (!toolSerial) return;
    try {
      const url = `${window.location.origin}/herramientas/${toolSerial}`;
      const qrDataURL = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrCodes(prev => ({
        ...prev,
        [toolSerial]: qrDataURL
      }));
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }, []);

  // ============================
  // SUSCRIPCIONES FIRESTORE
  // ============================

  // Suscripción en tiempo real para herramientas eléctricas
  const subscribeToTools = useCallback(() => {
    setLoading(true);
    try {
      const toolsCollection = collection(db, 'HERRAMIENTA_ELECTRICA');
      
      const unsubscribe = onSnapshot(toolsCollection, 
        (snapshot) => {
          const toolsList = snapshot.docs.map(doc => ({
            firebaseId: doc.id, // ID del documento en Firebase
            ...doc.data()
          }));
          
          setTools(toolsList);
          setLoading(false);
          
          // Generar QR codes para herramientas que tengan serial
          toolsList.forEach(tool => {
            if (tool.internal_serial_number) {
              generateQRCode(tool.internal_serial_number);
            }
          });
        },
        (error) => {
          console.error('Error en suscripción de herramientas:', error);
          showMessage('Error al cargar herramientas en tiempo real', 'error');
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error configurando suscripción de herramientas:', error);
      showMessage('Error al configurar conexión con Firestore', 'error');
      setLoading(false);
      return null;
    }
  }, [showMessage, generateQRCode]);

  // Suscripción para empleados (técnicos)
  const subscribeToEmpleados = useCallback(() => {
    try {
      const empleadosRef = collection(db, 'EMPLEADOS');
      
      const unsubscribe = onSnapshot(empleadosRef, 
        (snapshot) => {
          const empleadosList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setEmpleados(empleadosList);
        },
        (error) => {
          console.error('Error cargando empleados:', error);
          showMessage('Error al cargar lista de empleados', 'error');
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error en suscripción de empleados:', error);
      return null;
    }
  }, [showMessage]);

  // ============================
  // OPERACIONES CRUD
  // ============================

  // Subir imagen a Firebase Storage
  const uploadImage = useCallback(async (file, toolId) => {
    try {
      const fileName = `${toolId}_${Date.now()}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, `herramientas/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      throw new Error('Error al subir la imagen: ' + error.message);
    }
  }, []);

  // Validar formulario
  const validateForm = useCallback(() => {
    if (!toolForm.description?.trim()) {
      showMessage('La descripción del equipo es obligatoria', 'error');
      return false;
    }
    if (!toolForm.internal_serial_number?.trim()) {
      showMessage('El número de serie interno es obligatorio', 'error');
      return false;
    }
    if (!toolForm.estado) {
      showMessage('El estado de la herramienta es obligatorio', 'error');
      return false;
    }
    return true;
  }, [toolForm, showMessage]);

  // Guardar herramienta (crear o actualizar)
  const handleSaveTool = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      let foto_url = toolForm.foto_url;
      
      // Subir nueva imagen si existe
      if (imageFile) {
        foto_url = await uploadImage(imageFile, toolForm.internal_serial_number || 'temp');
      }

      const toolData = {
        ...toolForm,
        foto_url,
        fecha_actualizacion: serverTimestamp()
      };

      if (editingTool) {
        // Actualizar herramienta existente
        const toolRef = doc(db, 'HERRAMIENTA_ELECTRICA', editingTool.firebaseId);
        await updateDoc(toolRef, toolData);
        showMessage('Herramienta actualizada correctamente', 'success');
      } else {
        // Crear nueva herramienta
        const toolsCollection = collection(db, 'HERRAMIENTA_ELECTRICA');
        await addDoc(toolsCollection, toolData);
        showMessage('Herramienta registrada correctamente', 'success');
      }
      
      // Reset form
      setToolForm(initialToolForm);
      setEditingTool(null);
      setImageFile(null);
      setImagePreview('');
      setShowToolForm(false);
      
    } catch (error) {
      console.error('Error guardando herramienta:', error);
      showMessage('Error al guardar herramienta: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toolForm, editingTool, validateForm, imageFile, uploadImage, showMessage]);

  // Eliminar herramienta
  const handleDeleteTool = useCallback(async (tool) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la herramienta "${tool.description}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'HERRAMIENTA_ELECTRICA', tool.firebaseId));
      showMessage('Herramienta eliminada correctamente', 'success');
    } catch (error) {
      console.error('Error eliminando herramienta:', error);
      showMessage('Error al eliminar herramienta: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  // ============================
  // MANEJADORES DE EVENTOS
  // ============================

  // Manejar cambios en formulario
  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setToolForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // Manejar carga de imagen
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (5MB máximo)
      if (file.size > 5000000) {
        showMessage('La imagen debe ser menor a 5MB', 'error');
        return;
      }
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showMessage('Solo se permiten archivos de imagen', 'error');
        return;
      }
      
      setImageFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, [showMessage]);

  // Editar herramienta
  const handleEditTool = useCallback((tool) => {
    setEditingTool(tool);
    setToolForm({
      id: tool.id || '',
      description: tool.description || '',
      estado: tool.estado || 'operativo',
      fabrication_date: tool.fabrication_date || '',
      fecha_inspeccion: tool.fecha_inspeccion || '',
      purchase_date: tool.purchase_date || '',
      machine_serial: tool.machine_serial || '',
      internal_serial_number: tool.internal_serial_number || '',
      invoice: tool.invoice || '',
      tecnico: tool.tecnico || '',
      mantenimiento_correctivo: tool.mantenimiento_correctivo || '',
      mantenimiento_preventivo: tool.mantenimiento_preventivo || '',
      persona_inspeccion: tool.persona_inspeccion || '',
      persona_mantenimiento: tool.persona_mantenimiento || '',
      lugar: tool.lugar || '',
      foto_url: tool.foto_url || ''
    });
    setImagePreview(tool.foto_url || '');
    setShowToolForm(true);
  }, []);

  // Cancelar edición/creación
  const handleCancel = useCallback(() => {
    setToolForm(initialToolForm);
    setEditingTool(null);
    setImageFile(null);
    setImagePreview('');
    setShowToolForm(false);
  }, []);

  // Imprimir QR
  const handlePrintQR = useCallback((tool) => {
    const qrDataURL = qrCodes[tool.internal_serial_number];
    if (!qrDataURL) {
      showMessage('Código QR no disponible', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Código QR - ${tool.description}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px; 
              background: white;
            }
            .qr-container {
              border: 2px solid #000;
              padding: 20px;
              display: inline-block;
              margin: 20px;
              background: white;
            }
            @media print {
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>${tool.description}</h2>
            <p>Serial: ${tool.internal_serial_number}</p>
            <img src="${qrDataURL}" alt="Código QR" width="200" height="200" />
            <p>Escanea para ver información completa</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  }, [qrCodes, showMessage]);

  // ============================
  // HOOKS DE EFECTOS
  // ============================

  useEffect(() => {
    const unsubscribeTools = subscribeToTools();
    const unsubscribeEmpleados = subscribeToEmpleados();
    
    return () => {
      if (unsubscribeTools) unsubscribeTools();
      if (unsubscribeEmpleados) unsubscribeEmpleados();
    };
  }, [subscribeToTools, subscribeToEmpleados]);

  // ============================
  // FUNCIONES DE FILTRADO
  // ============================

  // Filtrar herramientas
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (tool.id && tool.id.toLowerCase().includes(searchLower)) ||
        (tool.description && tool.description.toLowerCase().includes(searchLower)) ||
        (tool.internal_serial_number && tool.internal_serial_number.toLowerCase().includes(searchLower)) ||
        (tool.machine_serial && tool.machine_serial.toLowerCase().includes(searchLower)) ||
        (tool.tecnico && tool.tecnico.toLowerCase().includes(searchLower)) ||
        (tool.estado && tool.estado.toLowerCase().includes(searchLower));
      
      const matchesEstado = filterEstado === 'todos' || tool.estado === filterEstado;
      
      return matchesSearch && matchesEstado;
    });
  }, [tools, searchTerm, filterEstado]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = tools.length;
    const operativas = tools.filter(t => t.estado === 'operativo').length;
    const enReparacion = tools.filter(t => t.estado === 'en_reparacion').length;
    const dadoDeBaja = tools.filter(t => t.estado === 'dado_de_baja').length;
    const enMantenimiento = tools.filter(t => t.estado === 'en_mantenimiento').length;
    
    return { total, operativas, enReparacion, dadoDeBaja, enMantenimiento };
  }, [tools]);

  // ============================
  // COMPONENTES DE UI
  // ============================

  // Componente de Badge para estados
  const EstadoBadge = ({ estado }) => {
    const estadoConfig = ESTADOS_HERRAMIENTA.find(e => e.value === estado) || 
      { label: estado, bgColor: 'bg-gray-100', textColor: 'text-gray-800', borderColor: 'border-gray-200' };
    
    return (
      <span className={`estado-badge px-2 py-1 rounded-full text-xs font-medium ${estadoConfig.bgColor} ${estadoConfig.textColor} ${estadoConfig.borderColor} border`}>
        {estadoConfig.label}
      </span>
    );
  };

  // Componente de estadísticas
  const StatCard = ({ title, value, bgColor = "bg-white", textColor = "text-gray-900", cardType = "" }) => (
    <div className={`stats-card ${cardType} ${bgColor} rounded-lg shadow-sm border border-gray-200 p-6`}>
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
    </div>
  );

  // ============================
  // RENDER PRINCIPAL
  // ============================

  return (
    <div className="herramientas-container container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="herramientas-header bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="herramientas-title text-3xl font-bold text-gray-900 flex items-center gap-2">
              🔧 Herramientas Eléctricas
            </h1>
            <p className="text-gray-600 mt-1">Gestión y control de equipos industriales</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              {viewMode === 'cards' ? '📊 Vista Tabla' : '📋 Vista Cards'}
            </button>
            <button
              onClick={() => setShowToolForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              ➕ Nueva Herramienta
            </button>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {message && (
        <div className={`message-container mb-6 p-4 rounded-lg border ${
          messageType === 'success' ? 'message-success bg-green-50 border-green-200 text-green-800' :
          messageType === 'error' ? 'message-error bg-red-50 border-red-200 text-red-800' :
          'message-info bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {message}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total" value={stats.total} bgColor="bg-blue-50" textColor="text-blue-900" cardType="total" />
        <StatCard title="Operativas" value={stats.operativas} bgColor="bg-green-50" textColor="text-green-900" cardType="operativas" />
        <StatCard title="En Reparación" value={stats.enReparacion} bgColor="bg-yellow-50" textColor="text-yellow-900" cardType="reparacion" />
        <StatCard title="Dados de Baja" value={stats.dadoDeBaja} bgColor="bg-red-50" textColor="text-red-900" cardType="baja" />
        <StatCard title="Mantenimiento" value={stats.enMantenimiento} bgColor="bg-purple-50" textColor="text-purple-900" cardType="mantenimiento" />
      </div>

      {/* Formulario de Nueva/Editar Herramienta */}
      {showToolForm && (
        <div className="form-container bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {editingTool ? '✏️ Editar Herramienta' : '➕ Nueva Herramienta'}
          </h2>
          
          <form onSubmit={handleSaveTool} className="space-y-6">
            {/* Grid de campos principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="form-label block text-sm font-medium text-gray-900 mb-2">
                  ID Herramienta
                </label>
                <input
                  type="text"
                  name="id"
                  value={toolForm.id}
                  onChange={handleFormChange}
                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  placeholder="ID único de la herramienta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Descripción del Equipo *
                </label>
                <input
                  type="text"
                  name="description"
                  value={toolForm.description}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  placeholder="Ej: Taladro percutor industrial"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Serial de Máquina
                </label>
                <input
                  type="text"
                  name="machine_serial"
                  value={toolForm.machine_serial}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  placeholder="Serial del fabricante"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Serial Interno *
                </label>
                <input
                  type="text"
                  name="internal_serial_number"
                  value={toolForm.internal_serial_number}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  placeholder="Número de serie interno"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Estado *
                </label>
                <select
                  name="estado"
                  value={toolForm.estado}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  required
                >
                  {ESTADOS_HERRAMIENTA.map(estado => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Técnico Encargado
                </label>
                <select
                  name="tecnico"
                  value={toolForm.tecnico}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="">Seleccionar técnico...</option>
                  {empleados.map(empleado => (
                    <option key={empleado.id} value={empleado.nombre || empleado.id}>
                      {empleado.nombre || empleado.id} {empleado.cedula ? `- ${empleado.cedula}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Fecha de Fabricación
                </label>
                <input
                  type="date"
                  name="fabrication_date"
                  value={toolForm.fabrication_date}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  name="purchase_date"
                  value={toolForm.purchase_date}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Fecha de Inspección
                </label>
                <input
                  type="date"
                  name="fecha_inspeccion"
                  value={toolForm.fecha_inspeccion}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Número de Factura
                </label>
                <input
                  type="text"
                  name="invoice"
                  value={toolForm.invoice}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  placeholder="Número de factura"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Ubicación
                </label>
                <input
                  type="text"
                  name="lugar"
                  value={toolForm.lugar}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  placeholder="Ubicación física del equipo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Persona de Inspección
                </label>
                <input
                  type="text"
                  name="persona_inspeccion"
                  value={toolForm.persona_inspeccion}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  placeholder="Responsable de inspección"
                />
              </div>
            </div>

            {/* Campos de mantenimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Mantenimiento Correctivo
                </label>
                <textarea
                  name="mantenimiento_correctivo"
                  value={toolForm.mantenimiento_correctivo}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  placeholder="Detalles del mantenimiento correctivo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Mantenimiento Preventivo
                </label>
                <textarea
                  name="mantenimiento_preventivo"
                  value={toolForm.mantenimiento_preventivo}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  placeholder="Detalles del mantenimiento preventivo"
                />
              </div>
            </div>

            {/* Campo de imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Foto del Equipo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              />
              {imagePreview && (
                <div className="mt-3">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="image-preview w-32 h-32 object-cover rounded-md border border-gray-300"
                  />
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : (editingTool ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="filters-container bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Buscar por ID, descripción, serial, técnico o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            />
          </div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
          >
            <option value="todos">Todos los estados</option>
            {ESTADOS_HERRAMIENTA.map(estado => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contenido principal */}
      {loading ? (
        <div className="text-center py-12">
          <div className="loading-spinner inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando herramientas...</p>
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay herramientas registradas</h3>
          <p className="text-gray-500">
            {searchTerm || filterEstado !== 'todos' 
              ? 'No se encontraron herramientas con los filtros aplicados'
              : 'Comienza registrando tu primera herramienta eléctrica'
            }
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        // Vista de Cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map(tool => (
            <div key={tool.firebaseId} className="tool-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Imagen */}
              <div className="tool-image-container h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                {tool.foto_url ? (
                  <img 
                    src={tool.foto_url} 
                    alt={tool.description}
                    className="tool-image w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-6xl text-gray-300">🔧</div>
                )}
              </div>
              
              {/* Contenido */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {tool.description || 'Sin descripción'}
                  </h3>
                  <EstadoBadge estado={tool.estado} />
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div><strong className="text-gray-900">Serial:</strong> {tool.internal_serial_number || 'No asignado'}</div>
                  <div><strong className="text-gray-900">Técnico:</strong> {tool.tecnico || 'No asignado'}</div>
                  <div><strong className="text-gray-900">Lugar:</strong> {tool.lugar || 'No especificado'}</div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEditTool(tool)}
                    className="action-button action-edit px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  {tool.internal_serial_number && (
                    <button
                      onClick={() => handlePrintQR(tool)}
                      className="action-button action-qr px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
                    >
                      🖨️ QR
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTool(tool)}
                    className="action-button action-delete px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Vista de Tabla
        <div className="tools-table bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Serial Interno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Serial Máquina
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Técnico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTools.map((tool) => (
                  <tr key={tool.firebaseId} className="table-row hover:bg-gray-50">
                    <td className="table-cell px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {tool.foto_url ? (
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={tool.foto_url} 
                              alt={tool.description} 
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              🔧
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {tool.description || 'Sin descripción'}
                          </div>
                          {tool.id && (
                            <div className="text-sm text-gray-500">ID: {tool.id}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tool.internal_serial_number || (
                        <span className="text-gray-500 italic">No asignado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tool.machine_serial || (
                        <span className="text-gray-500 italic">No asignado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tool.tecnico || (
                        <span className="text-gray-500 italic">No asignado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EstadoBadge estado={tool.estado} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditTool(tool)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        {tool.internal_serial_number && (
                          <button
                            onClick={() => handlePrintQR(tool)}
                            className="text-green-600 hover:text-green-900"
                            title="Imprimir QR"
                          >
                            🖨️
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTool(tool)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HerramientaElectrica;