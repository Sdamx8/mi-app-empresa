// HerramientaManual.js - Módulo de administración de herramientas manuales
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../core/config/firebaseConfig';
import { THEME_COLORS } from '../../shared/constants';

// Estados específicos para herramientas manuales
const ESTADOS_HERRAMIENTA_MANUAL = [
  { value: 'disponible', label: 'Disponible', color: '#28a745' },
  { value: 'asignada', label: 'Asignada', color: '#007bff' },
  { value: 'mantenimiento', label: 'En Mantenimiento', color: '#ffc107' },
  { value: 'perdida', label: 'Perdida', color: '#dc3545' },
  { value: 'dañada', label: 'Dañada', color: '#6c757d' },
  { value: 'baja', label: 'Dada de Baja', color: '#343a40' }
];

const initialForm = {
  internal_code: '',
  description: '',
  estado: 'disponible',
  fecha_asignacion: '',
  lugar: '',
  tecnico: ''
};

const HerramientaManual = () => {
  const [tools, setTools] = useState([]);
  const [editingTool, setEditingTool] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [showForm, setShowForm] = useState(false);

  // Obtener herramientas de la base de datos
  // Mostrar mensajes con auto-hide
  const showMessage = useCallback((msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  }, []);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔨 Intentando cargar herramientas manuales...');
      const toolsCollection = collection(db, 'HERRAMIENTA_MANUAL');
      const snapshot = await getDocs(toolsCollection);
      console.log('📊 Documentos encontrados:', snapshot.docs.length);
      
      const toolsList = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('🔨 Herramienta manual encontrada:', doc.id, data);
        return { 
          id: doc.id, 
          ...data,
          // Asegurar que las fechas sean strings
          fecha_asignacion: data.fecha_asignacion || ''
        };
      });
      
      setTools(toolsList);
      showMessage(`Herramientas manuales cargadas correctamente (${toolsList.length} encontradas)`, 'success');
    } catch (error) {
      console.error('❌ Error fetching tools:', error);
      showMessage(`Error al cargar herramientas manuales: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  // Manejar cambios en el formulario
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // Validar formulario
  const validateForm = useCallback(() => {
    const required = ['internal_code', 'description', 'estado', 'lugar', 'tecnico'];
    const missing = required.filter(field => !form[field]?.trim());
    
    if (missing.length > 0) {
      showMessage(`Campos obligatorios faltantes: ${missing.join(', ')}`, 'error');
      return false;
    }
    return true;
  }, [form, showMessage]);

  // Guardar herramienta
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const toolData = {
        ...form,
        fecha_actualizacion: serverTimestamp(),
        ...(editingTool ? {} : { fecha_creacion: serverTimestamp() })
      };

      if (editingTool) {
        const toolRef = doc(db, 'HERRAMIENTA_MANUAL', editingTool.id);
        await updateDoc(toolRef, toolData);
        showMessage('Herramienta manual actualizada correctamente', 'success');
        setEditingTool(null);
      } else {
        await addDoc(collection(db, 'HERRAMIENTA_MANUAL'), toolData);
        showMessage('Herramienta manual agregada correctamente', 'success');
      }
      
      setForm(initialForm);
      setShowForm(false);
      fetchTools();
    } catch (error) {
      console.error('Error saving tool:', error);
      showMessage('Error al guardar herramienta manual', 'error');
    } finally {
      setLoading(false);
    }
  }, [form, editingTool, validateForm, showMessage, fetchTools]);

  // Editar herramienta
  const handleEdit = useCallback((tool) => {
    setEditingTool(tool);
    setForm(tool);
    setShowForm(true);
  }, []);

  // Eliminar herramienta
  const handleDeleteTool = useCallback(async (id, description) => {
    if (window.confirm(`¿Seguro que deseas eliminar la herramienta "${description}"?`)) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'HERRAMIENTA_MANUAL', id));
        showMessage('Herramienta manual eliminada correctamente', 'success');
        fetchTools();
      } catch (error) {
        console.error('Error deleting tool:', error);
        showMessage('Error al eliminar herramienta manual', 'error');
      } finally {
        setLoading(false);
      }
    }
  }, [showMessage, fetchTools]);

  // Cancelar edición
  const handleCancel = useCallback(() => {
    setEditingTool(null);
    setForm(initialForm);
    setShowForm(false);
  }, []);

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
    const disponibles = tools.filter(t => t.estado === 'disponible').length;
    const asignadas = tools.filter(t => t.estado === 'asignada').length;
    const mantenimiento = tools.filter(t => t.estado === 'mantenimiento').length;
    const dañadas = tools.filter(t => t.estado === 'dañada' || t.estado === 'perdida').length;
    
    return { total, disponibles, asignadas, mantenimiento, dañadas };
  }, [tools]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: `3px solid ${THEME_COLORS.primary}`,
        paddingBottom: '15px'
      }}>
        <h1 style={{ margin: 0, color: THEME_COLORS.primary }}>
          🔨 Administración de Herramientas Manuales
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchTools}
            disabled={loading}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              opacity: loading ? 0.6 : 1
            }}
            onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#218838')}
            onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#28a745')}
          >
            {loading ? '🔄 Cargando...' : '🔄 Recargar'}
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
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.target.style.backgroundColor = THEME_COLORS.primary}
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
        <StatCard title="Disponibles" value={stats.disponibles} color={THEME_COLORS.success} />
        <StatCard title="Asignadas" value={stats.asignadas} color={THEME_COLORS.info} />
        <StatCard title="Mantenimiento" value={stats.mantenimiento} color={THEME_COLORS.warning} />
        <StatCard title="Problemáticas" value={stats.dañadas} color={THEME_COLORS.danger} />
      </div>

      {/* Formulario */}
      {showForm && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: `2px solid ${THEME_COLORS.primary}`,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: THEME_COLORS.primary }}>
            {editingTool ? '✏️ Editar Herramienta Manual' : '➕ Nueva Herramienta Manual'}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            <FormField
              label="Código Interno *"
              name="internal_code"
              value={form.internal_code}
              onChange={handleChange}
              placeholder="Código único de la herramienta"
            />
            
            <FormField
              label="Descripción *"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Descripción detallada de la herramienta"
            />
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Estado *
              </label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                required
              >
                {ESTADOS_HERRAMIENTA_MANUAL.map(estado => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>
            
            <FormField
              label="Fecha de Asignación"
              name="fecha_asignacion"
              type="date"
              value={form.fecha_asignacion}
              onChange={handleChange}
            />
            
            <FormField
              label="Lugar *"
              name="lugar"
              value={form.lugar}
              onChange={handleChange}
              placeholder="Ubicación actual de la herramienta"
            />
            
            <FormField
              label="Técnico Encargado *"
              name="tecnico"
              value={form.tecnico}
              onChange={handleChange}
              placeholder="Técnico responsable de la herramienta"
            />
            
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={handleCancel}
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
          placeholder="🔍 Buscar herramientas manuales..."
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
          {ESTADOS_HERRAMIENTA_MANUAL.map(estado => (
            <option key={estado.value} value={estado.value}>
              {estado.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de herramientas */}
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
          <h3 style={{ margin: 0 }}>Listado de Herramientas Manuales ({filteredTools.length})</h3>
          {loading && <span>🔄 Cargando...</span>}
        </div>
        
        {filteredTools.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            {tools.length === 0 ? '📦 No hay herramientas manuales registradas' : '🔍 No se encontraron herramientas con los filtros aplicados'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={tableHeaderStyle}>Código Interno</th>
                  <th style={tableHeaderStyle}>Descripción</th>
                  <th style={tableHeaderStyle}>Estado</th>
                  <th style={tableHeaderStyle}>Fecha Asignación</th>
                  <th style={tableHeaderStyle}>Lugar</th>
                  <th style={tableHeaderStyle}>Técnico</th>
                  <th style={tableHeaderStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTools.map((tool, index) => (
                  <tr key={tool.id} style={{ 
                    backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                    transition: 'background-color 0.2s ease'
                  }}>
                    <td style={tableCellStyle}>{tool.internal_code}</td>
                    <td style={tableCellStyle}>{tool.description}</td>
                    <td style={tableCellStyle}>
                      <EstadoBadge estado={tool.estado} />
                    </td>
                    <td style={tableCellStyle}>
                      {tool.fecha_asignacion ? 
                        new Date(tool.fecha_asignacion).toLocaleDateString('es-ES') : 
                        'Sin asignar'
                      }
                    </td>
                    <td style={tableCellStyle}>{tool.lugar}</td>
                    <td style={tableCellStyle}>{tool.tecnico}</td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handleEdit(tool)}
                          style={{
                            backgroundColor: THEME_COLORS.info,
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="Editar herramienta"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteTool(tool.id, tool.description)}
                          style={{
                            backgroundColor: THEME_COLORS.danger,
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
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
  const estadoConfig = ESTADOS_HERRAMIENTA_MANUAL.find(e => e.value === estado) || 
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

export default HerramientaManual;
