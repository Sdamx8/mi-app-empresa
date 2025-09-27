// HerramientaElectrica.js - Módulo optimizado de administración de herramientas eléctricas
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
  where,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../core/config/firebaseConfig';
import { THEME_COLORS } from '../../shared/constants';
import QRCode from 'qrcode';
import ToolDetailView from './components/ToolDetailView';
import './HerramientaElectrica.css';

// Estados disponibles para herramientas
const ESTADOS_HERRAMIENTA = [
  { value: 'operativo', label: 'Operativo', color: '#28a745' },
  { value: 'mantenimiento', label: 'En Mantenimiento', color: '#ffc107' },
  { value: 'fuera_servicio', label: 'Fuera de Servicio', color: '#dc3545' },
  { value: 'revision', label: 'En Revisión', color: '#17a2b8' },
  { value: 'reparacion', label: 'En Reparación', color: '#fd7e14' }
];

// Tipos de mantenimiento
const TIPOS_MANTENIMIENTO = [
  { value: 'preventivo', label: 'Preventivo' },
  { value: 'correctivo', label: 'Correctivo' },
  { value: 'calibracion', label: 'Calibración' },
  { value: 'revision', label: 'Revisión' }
];

const initialForm = {
  internal_serial_number: '',
  machine_serial: '',
  fabrication_date: '',
  description: '',
  purchase_date: '',
  invoice: '',
  lugar: '',
  estado: 'operativo',
  tecnico: '',
  foto_url: ''
};

const initialMaintenanceForm = {
  fecha: '',
  tecnico_encargado: '',
  tipo: 'preventivo',
  descripcion: '',
  repuestos: '',
  proxima_fecha: '',
  observaciones: ''
};

const HerramientaElectrica = () => {
  const [tools, setTools] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [editingTool, setEditingTool] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [form, setForm] = useState(initialForm);
  const [maintenanceForm, setMaintenanceForm] = useState(initialMaintenanceForm);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'card', 'detail'
  const [qrCodes, setQrCodes] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Hook para cargar empleados técnicos
  const fetchEmpleados = useCallback(async () => {
    try {
      const empleadosRef = collection(db, 'EMPLEADOS');
      const q = query(empleadosRef, where('tipo_empleado', '==', 'tecnico'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const empleadosList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEmpleados(empleadosList);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching empleados:', error);
      showMessage('Error al cargar empleados', 'error');
    }
  }, []);

  // Mostrar mensajes con auto-hide
  const showMessage = useCallback((msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  }, []);

  // Suscripción en tiempo real para herramientas
  const subscribeToTools = useCallback(() => {
    setLoading(true);
    const toolsCollection = collection(db, 'HERRAMIENTA_ELECTRICA');
    
    const unsubscribe = onSnapshot(toolsCollection, 
      (snapshot) => {
        const toolsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fabrication_date: doc.data().fabrication_date || '',
          purchase_date: doc.data().purchase_date || ''
        }));
        
        setTools(toolsList);
        setLoading(false);
        
        // Generar QR codes para herramientas
        toolsList.forEach(tool => {
          generateQRCode(tool.internal_serial_number);
        });
      },
      (error) => {
        console.error('Error in tools subscription:', error);
        showMessage('Error al cargar herramientas en tiempo real', 'error');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [showMessage]);

  // Suscripción para historial de mantenimiento
  const subscribeToMaintenance = useCallback((toolId) => {
    if (!toolId) return;

    const maintenanceRef = collection(db, 'HERRAMIENTA_ELECTRICA', toolId, 'MANTENIMIENTOS');
    const q = query(maintenanceRef, orderBy('fecha', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const maintenanceList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaintenanceHistory(maintenanceList);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribeTools = subscribeToTools();
    const unsubscribeEmpleados = fetchEmpleados();
    
    return () => {
      if (unsubscribeTools) unsubscribeTools();
      if (unsubscribeEmpleados) unsubscribeEmpleados();
    };
  }, [subscribeToTools, fetchEmpleados]);

  // Generar código QR
  const generateQRCode = useCallback(async (serialNumber) => {
    try {
      const url = `${window.location.origin}/herramientas/${serialNumber}`;
      const qrDataURL = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodes(prev => ({
        ...prev,
        [serialNumber]: qrDataURL
      }));
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }, []);

  // Manejar carga de imagen
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        showMessage('La imagen debe ser menor a 5MB', 'error');
        return;
      }
      
      setImageFile(file);
      
      // Preview de la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, [showMessage]);

  // Subir imagen a Firebase Storage
  const uploadImage = useCallback(async (file, serialNumber) => {
    try {
      const storageRef = ref(storage, `herramientas/${serialNumber}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Error al subir la imagen');
    }
  }, []);

  // Validar formulario
  const validateForm = useCallback(() => {
    const required = ['internal_serial_number', 'machine_serial', 'description', 'lugar', 'estado', 'tecnico'];
    const missing = required.filter(field => !form[field]?.trim());
    
    if (missing.length > 0) {
      showMessage(`Campos obligatorios faltantes: ${missing.join(', ')}`, 'error');
      return false;
    }

    // Validar unicidad del serial interno
    if (!editingTool && tools.some(tool => tool.internal_serial_number === form.internal_serial_number)) {
      showMessage('Ya existe una herramienta con ese serial interno', 'error');
      return false;
    }
    
    return true;
  }, [form, showMessage, tools, editingTool]);

  // Manejar cambios en el formulario
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // Manejar cambios en el formulario de mantenimiento
  const handleMaintenanceChange = useCallback((e) => {
    const { name, value } = e.target;
    setMaintenanceForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // Guardar herramienta
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      let foto_url = form.foto_url;
      
      // Subir nueva imagen si existe
      if (imageFile) {
        foto_url = await uploadImage(imageFile, form.internal_serial_number);
      }

      const toolData = {
        ...form,
        foto_url,
        fecha_actualizacion: serverTimestamp(),
        ...(editingTool ? {} : { fecha_creacion: serverTimestamp() })
      };

      if (editingTool) {
        const toolRef = doc(db, 'HERRAMIENTA_ELECTRICA', editingTool.id);
        await updateDoc(toolRef, toolData);
        showMessage('Herramienta actualizada correctamente', 'success');
        setEditingTool(null);
      } else {
        const toolRef = doc(db, 'HERRAMIENTA_ELECTRICA', form.internal_serial_number);
        await setDoc(toolRef, toolData);
        showMessage('Herramienta agregada correctamente', 'success');
      }
      
      setForm(initialForm);
      setImageFile(null);
      setImagePreview('');
      setShowForm(false);
    } catch (error) {
      console.error('Error saving tool:', error);
      showMessage('Error al guardar herramienta', 'error');
    } finally {
      setLoading(false);
    }
  }, [form, editingTool, validateForm, showMessage, imageFile, uploadImage]);

  // Guardar mantenimiento
  const handleMaintenanceSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!selectedTool || !maintenanceForm.fecha || !maintenanceForm.tecnico_encargado || !maintenanceForm.descripcion) {
      showMessage('Complete todos los campos obligatorios del mantenimiento', 'error');
      return;
    }

    setLoading(true);
    try {
      const maintenanceRef = collection(db, 'HERRAMIENTA_ELECTRICA', selectedTool.id, 'MANTENIMIENTOS');
      await addDoc(maintenanceRef, {
        ...maintenanceForm,
        fecha_creacion: serverTimestamp()
      });
      
      showMessage('Mantenimiento registrado correctamente', 'success');
      setMaintenanceForm(initialMaintenanceForm);
      setShowMaintenanceForm(false);
    } catch (error) {
      console.error('Error saving maintenance:', error);
      showMessage('Error al guardar mantenimiento', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedTool, maintenanceForm, showMessage]);

  // Editar herramienta
  const handleEdit = useCallback((tool) => {
    setEditingTool(tool);
    setForm(tool);
    setImagePreview(tool.foto_url || '');
    setShowForm(true);
  }, []);

  // Ver hoja de vida
  const handleViewDetail = useCallback((tool) => {
    setSelectedTool(tool);
    setViewMode('detail');
    subscribeToMaintenance(tool.id);
  }, [subscribeToMaintenance]);

  // Eliminar herramienta
  const handleDeleteTool = useCallback(async (id, description) => {
    if (window.confirm(`¿Seguro que deseas eliminar la herramienta "${description}"?`)) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'HERRAMIENTA_ELECTRICA', id));
        showMessage('Herramienta eliminada correctamente', 'success');
      } catch (error) {
        console.error('Error deleting tool:', error);
        showMessage('Error al eliminar herramienta', 'error');
      } finally {
        setLoading(false);
      }
    }
  }, [showMessage]);

  // Cancelar edición
  const handleCancel = useCallback(() => {
    setEditingTool(null);
    setForm(initialForm);
    setImageFile(null);
    setImagePreview('');
    setShowForm(false);
  }, []);

  // Imprimir QR
  const handlePrintQR = useCallback((serialNumber) => {
    const qrDataURL = qrCodes[serialNumber];
    if (!qrDataURL) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${serialNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px; 
            }
            .qr-container {
              border: 2px solid #000;
              padding: 20px;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>Herramienta Eléctrica</h2>
            <p><strong>Serial: ${serialNumber}</strong></p>
            <img src="${qrDataURL}" alt="QR Code" />
            <p>Escanea para ver información completa</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [qrCodes]);

  // Filtrar herramientas
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = !searchTerm || 
        Object.values(tool).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesEstado = filterEstado === 'todos' || tool.estado === filterEstado;
      
      return matchesSearch && matchesEstado;
    });
  }, [tools, searchTerm, filterEstado]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = tools.length;
    const operativas = tools.filter(t => t.estado === 'operativo').length;
    const mantenimiento = tools.filter(t => t.estado === 'mantenimiento').length;
    const fueraServicio = tools.filter(t => t.estado === 'fuera_servicio').length;
    
    return { total, operativas, mantenimiento, fueraServicio };
  }, [tools]);

  if (viewMode === 'detail' && selectedTool) {
    return (
      <ToolDetailView 
        tool={selectedTool} 
        maintenanceHistory={maintenanceHistory}
        onBack={() => {
          setViewMode('list');
          setSelectedTool(null);
        }}
        onAddMaintenance={() => setShowMaintenanceForm(true)}
        onPrintQR={() => handlePrintQR(selectedTool.internal_serial_number)}
        qrCode={qrCodes[selectedTool.internal_serial_number]}
        showMaintenanceForm={showMaintenanceForm}
        maintenanceForm={maintenanceForm}
        empleados={empleados}
        onMaintenanceChange={handleMaintenanceChange}
        onMaintenanceSubmit={handleMaintenanceSubmit}
        onCancelMaintenance={() => {
          setShowMaintenanceForm(false);
          setMaintenanceForm(initialMaintenanceForm);
        }}
        loading={loading}
      />
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: `3px solid ${THEME_COLORS.primary}`,
        paddingBottom: '15px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h1 style={{ margin: 0, color: THEME_COLORS.primary }}>
          🔧 Administración de Herramientas Eléctricas
        </h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'card' : 'list')}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {viewMode === 'list' ? '📋 Vista Cards' : '📊 Vista Lista'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              backgroundColor: THEME_COLORS.primary,
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {showForm ? '❌ Cancelar' : '➕ Nueva Herramienta'}
          </button>
        </div>
      </div>

      {/* Mensaje */}
      {message && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: 
            messageType === 'success' ? '#d4edda' :
            messageType === 'error' ? '#f8d7da' : '#d1ecf1',
          border: `1px solid ${
            messageType === 'success' ? THEME_COLORS.success :
            messageType === 'error' ? THEME_COLORS.danger : THEME_COLORS.info
          }`,
          color:
            messageType === 'success' ? '#155724' :
            messageType === 'error' ? '#721c24' : '#0c5460'
        }}>
          {message}
        </div>
      )}

      {/* Estadísticas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px',
        marginBottom: '30px' 
      }}>
        <StatCard title="Total" value={stats.total} color={THEME_COLORS.primary} />
        <StatCard title="Operativas" value={stats.operativas} color={THEME_COLORS.success} />
        <StatCard title="Mantenimiento" value={stats.mantenimiento} color={THEME_COLORS.warning} />
        <StatCard title="Fuera de Servicio" value={stats.fueraServicio} color={THEME_COLORS.danger} />
      </div>

      {/* Formulario */}
      {showForm && (
        <ToolForm 
          form={form}
          editingTool={editingTool}
          empleados={empleados}
          imagePreview={imagePreview}
          onChange={handleChange}
          onImageChange={handleImageChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      )}

      {/* Filtros */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px', 
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="🔍 Buscar herramientas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px 15px',
            border: '2px solid #ddd',
            borderRadius: '25px',
            fontSize: '14px',
            minWidth: '300px',
            flex: 1
          }}
        />
        
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          style={{
            padding: '10px 15px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="todos">Todos los estados</option>
          {ESTADOS_HERRAMIENTA.map(estado => (
            <option key={estado.value} value={estado.value}>
              {estado.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lista/Cards de herramientas */}
      {viewMode === 'list' ? (
        <ToolTable 
          tools={filteredTools}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteTool}
          onViewDetail={handleViewDetail}
          onPrintQR={handlePrintQR}
          qrCodes={qrCodes}
        />
      ) : (
        <ToolCards 
          tools={filteredTools}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteTool}
          onViewDetail={handleViewDetail}
          onPrintQR={handlePrintQR}
        />
      )}
    </div>
  );
};

// Componente para estadísticas
const StatCard = ({ title, value, color }) => (
  <div style={{
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: `3px solid ${color}`
  }}>
    <h3 style={{ margin: '0 0 10px 0', color: color, fontSize: '16px' }}>{title}</h3>
    <div style={{ fontSize: '32px', fontWeight: 'bold', color: color }}>{value}</div>
  </div>
);

// Componente del formulario
const ToolForm = ({ 
  form, 
  editingTool, 
  empleados, 
  imagePreview, 
  onChange, 
  onImageChange, 
  onSubmit, 
  onCancel, 
  loading 
}) => (
  <div style={{
    backgroundColor: '#f8f9fa',
    padding: '25px',
    borderRadius: '12px',
    marginBottom: '30px',
    border: `2px solid ${THEME_COLORS.primary}`,
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  }}>
    <h3 style={{ marginTop: 0, color: THEME_COLORS.primary }}>
      {editingTool ? '✏️ Editar Herramienta' : '➕ Nueva Herramienta'}
    </h3>
    
    <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
      <FormField
        label="Serial Interno *"
        name="internal_serial_number"
        value={form.internal_serial_number}
        onChange={onChange}
        disabled={!!editingTool}
        placeholder="Código interno de la empresa"
      />
      
      <FormField
        label="Serial de Máquina *"
        name="machine_serial"
        value={form.machine_serial}
        onChange={onChange}
        placeholder="Serial del fabricante"
      />
      
      <FormField
        label="Fecha de Fabricación"
        name="fabrication_date"
        type="date"
        value={form.fabrication_date}
        onChange={onChange}
      />
      
      <FormField
        label="Descripción *"
        name="description"
        value={form.description}
        onChange={onChange}
        placeholder="Descripción detallada"
      />
      
      <FormField
        label="Fecha de Compra"
        name="purchase_date"
        type="date"
        value={form.purchase_date}
        onChange={onChange}
      />
      
      <FormField
        label="Factura"
        name="invoice"
        value={form.invoice}
        onChange={onChange}
        placeholder="Número de factura"
      />
      
      <FormField
        label="Lugar *"
        name="lugar"
        value={form.lugar}
        onChange={onChange}
        placeholder="Ubicación actual"
      />
      
      <div>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Estado *
        </label>
        <select
          name="estado"
          value={form.estado}
          onChange={onChange}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px'
          }}
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
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Técnico Encargado *
        </label>
        <select
          name="tecnico"
          value={form.tecnico}
          onChange={onChange}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px'
          }}
          required
        >
          <option value="">Seleccionar técnico...</option>
          {empleados.map(empleado => (
            <option key={empleado.id} value={empleado.nombre}>
              {empleado.nombre} - {empleado.cedula}
            </option>
          ))}
        </select>
      </div>

      {/* Campo para subir imagen */}
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Fotografía
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={onImageChange}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
        {imagePreview && (
          <div style={{ marginTop: '10px' }}>
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }} 
            />
          </div>
        )}
      </div>
      
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            backgroundColor: THEME_COLORS.danger,
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: THEME_COLORS.success,
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Guardando...' : (editingTool ? 'Actualizar' : 'Guardar')}
        </button>
      </div>
    </form>
  </div>
);

// Componente de tabla
const ToolTable = ({ 
  tools, 
  loading, 
  onEdit, 
  onDelete, 
  onViewDetail, 
  onPrintQR, 
  qrCodes 
}) => (
  <div style={{ 
    backgroundColor: 'white', 
    borderRadius: '12px', 
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
  }}>
    <div style={{ 
      backgroundColor: THEME_COLORS.primary, 
      color: 'white', 
      padding: '15px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h3 style={{ margin: 0 }}>Listado de Herramientas ({tools.length})</h3>
      {loading && <span>🔄 Cargando...</span>}
    </div>
    
    {tools.length === 0 ? (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        📦 No hay herramientas registradas
      </div>
    ) : (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={tableHeaderStyle}>Foto</th>
              <th style={tableHeaderStyle}>Serial Interno</th>
              <th style={tableHeaderStyle}>Serial Máquina</th>
              <th style={tableHeaderStyle}>Descripción</th>
              <th style={tableHeaderStyle}>Estado</th>
              <th style={tableHeaderStyle}>Técnico</th>
              <th style={tableHeaderStyle}>Lugar</th>
              <th style={tableHeaderStyle}>QR</th>
              <th style={tableHeaderStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool, index) => (
              <tr key={tool.id} style={{ 
                backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                transition: 'background-color 0.2s ease'
              }}>
                <td style={tableCellStyle}>
                  {tool.foto_url ? (
                    <img 
                      src={tool.foto_url} 
                      alt="Herramienta" 
                      style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      📷
                    </div>
                  )}
                </td>
                <td style={tableCellStyle}>{tool.internal_serial_number}</td>
                <td style={tableCellStyle}>{tool.machine_serial}</td>
                <td style={tableCellStyle}>{tool.description}</td>
                <td style={tableCellStyle}>
                  <EstadoBadge estado={tool.estado} />
                </td>
                <td style={tableCellStyle}>{tool.tecnico}</td>
                <td style={tableCellStyle}>{tool.lugar}</td>
                <td style={tableCellStyle}>
                  {qrCodes[tool.internal_serial_number] && (
                    <button
                      onClick={() => onPrintQR(tool.internal_serial_number)}
                      style={{
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title="Imprimir QR"
                    >
                      🖨️
                    </button>
                  )}
                </td>
                <td style={tableCellStyle}>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => onViewDetail(tool)}
                      style={{
                        backgroundColor: '#6f42c1',
                        color: 'white',
                        border: 'none',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title="Ver hoja de vida"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => onEdit(tool)}
                      style={{
                        backgroundColor: THEME_COLORS.info,
                        color: 'white',
                        border: 'none',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title="Editar herramienta"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(tool.id, tool.description)}
                      style={{
                        backgroundColor: THEME_COLORS.danger,
                        color: 'white',
                        border: 'none',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title="Eliminar herramienta"
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
    )}
  </div>
);

// Componente de cards
const ToolCards = ({ 
  tools, 
  loading, 
  onEdit, 
  onDelete, 
  onViewDetail, 
  onPrintQR 
}) => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
    gap: '20px' 
  }}>
    {loading && (
      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
        🔄 Cargando herramientas...
      </div>
    )}
    
    {!loading && tools.length === 0 && (
      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666' }}>
        📦 No hay herramientas registradas
      </div>
    )}
    
    {tools.map((tool) => (
      <div key={tool.id} style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        padding: '20px',
        border: '1px solid #e9ecef'
      }}>
        {/* Imagen */}
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          {tool.foto_url ? (
            <img 
              src={tool.foto_url} 
              alt="Herramienta" 
              style={{ 
                width: '100%', 
                height: '150px', 
                borderRadius: '8px', 
                objectFit: 'cover',
                cursor: 'pointer'
              }}
              onClick={() => onViewDetail(tool)}
            />
          ) : (
            <div 
              style={{ 
                width: '100%', 
                height: '150px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '48px'
              }}
              onClick={() => onViewDetail(tool)}
            >
              🔧
            </div>
          )}
        </div>
        
        {/* Información */}
        <h4 style={{ margin: '0 0 10px 0', color: THEME_COLORS.primary }}>
          {tool.description}
        </h4>
        
        <div style={{ marginBottom: '15px', fontSize: '14px', lineHeight: '1.5' }}>
          <div><strong>Serial:</strong> {tool.internal_serial_number}</div>
          <div><strong>Máquina:</strong> {tool.machine_serial}</div>
          <div><strong>Técnico:</strong> {tool.tecnico}</div>
          <div><strong>Lugar:</strong> {tool.lugar}</div>
          <div style={{ marginTop: '8px' }}>
            <EstadoBadge estado={tool.estado} />
          </div>
        </div>
        
        {/* Acciones */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onViewDetail(tool)}
            style={{
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              flex: 1
            }}
          >
            👁️ Ver Detalle
          </button>
          <button
            onClick={() => onEdit(tool)}
            style={{
              backgroundColor: THEME_COLORS.info,
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              flex: 1
            }}
          >
            ✏️ Editar
          </button>
          <button
            onClick={() => onPrintQR(tool.internal_serial_number)}
            style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🖨️
          </button>
        </div>
      </div>
    ))}
  </div>
);

// Componente para campos del formulario
const FormField = ({ label, name, type = 'text', value, onChange, placeholder, disabled = false }) => (
  <div>
    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '10px',
        border: '2px solid #ddd',
        borderRadius: '6px',
        fontSize: '14px',
        backgroundColor: disabled ? '#f5f5f5' : 'white',
        cursor: disabled ? 'not-allowed' : 'text'
      }}
      required={label.includes('*')}
    />
  </div>
);

// Componente para el badge de estado
const EstadoBadge = ({ estado }) => {
  const estadoConfig = ESTADOS_HERRAMIENTA.find(e => e.value === estado) || 
    { label: estado, color: THEME_COLORS.secondary };
  
  return (
    <span style={{
      backgroundColor: estadoConfig.color,
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold'
    }}>
      {estadoConfig.label}
    </span>
  );
};

// Estilos para la tabla
const tableHeaderStyle = {
  padding: '12px 8px',
  textAlign: 'left',
  fontWeight: 'bold',
  borderBottom: '2px solid #ddd',
  backgroundColor: '#f8f9fa'
};

const tableCellStyle = {
  padding: '12px 8px',
  borderBottom: '1px solid #eee',
  fontSize: '14px'
};

export default HerramientaElectrica;