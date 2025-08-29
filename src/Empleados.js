// Empleados.js - Módulo de gestión de empleados
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { THEME_COLORS } from './constants';
import { logger } from './utils/logger';

// Estados y tipos disponibles
const TIPOS_EMPLEADO = [
  { value: 'tecnico', label: 'Técnico', color: '#007bff' },
  { value: 'administrativo', label: 'Administrativo', color: '#28a745' },
  { value: 'directivo', label: 'Directivo', color: '#dc3545' }
];

const ESTADOS_EMPLEADO = [
  { value: 'activo', label: 'Activo', color: '#28a745' },
  { value: 'inactivo', label: 'Inactivo', color: '#ffc107' },
  { value: 'retirado', label: 'Retirado', color: '#6c757d' }
];

const NIVELES_ACADEMICOS = [
  'Primaria', 'Bachillerato', 'Técnico', 'Tecnólogo', 
  'Profesional', 'Especialización', 'Maestría', 'Doctorado'
];

const TIPOS_DOCUMENTO = [
  'Cédula', 'Hoja de Vida', 'Certificados', 'Exámenes Médicos', 
  'Contrato', 'Otros'
];

const initialForm = {
  nombre_completo: '',
  identificacion: '',
  tipo_empleado: 'tecnico',
  cargo: '',
  fecha_ingreso: '',
  estado: 'activo',
  formacion: {
    nivel_academico: '',
    certificaciones: []
  },
  competencias: [],
  evaluaciones: [],
  seguridad_salud: {
    eps: '',
    arl: '',
    examen_medico_ingreso: '',
    ultimo_examen_medico: '',
    restricciones: ''
  },
  contacto: {
    telefono: '',
    correo: '',
    direccion: ''
  },
  documentos: []
};

const Empleados = () => {
  const [empleados, setEmpleados] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [activeSection, setActiveSection] = useState('basicos');

  // Estados para inputs de arrays
  const [competenciaInput, setCompetenciaInput] = useState('');
  const [certificacion, setCertificacion] = useState({
    nombre: '', entidad: '', fecha_emision: '', fecha_vencimiento: ''
  });
  const [evaluacion, setEvaluacion] = useState({
    fecha: '', evaluador: '', resultado: '', observaciones: ''
  });
  const [documento, setDocumento] = useState({
    tipo: '', url: '', fecha_subida: ''
  });

  // Mostrar mensajes con auto-hide
  const showMessage = useCallback((msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  }, []);

  // Obtener empleados de la base de datos
  const fetchEmpleados = useCallback(async () => {
    setLoading(true);
    try {
      logger.info('👥 Intentando cargar empleados...');
      const empleadosCollection = collection(db, 'EMPLEADOS');
      const snapshot = await getDocs(empleadosCollection);
      logger.debug('📊 Empleados encontrados:', snapshot.docs.length);
      
      const empleadosList = snapshot.docs.map(doc => {
        const data = doc.data();
        logger.debug('👤 Empleado encontrado:', doc.id, data);
        return { 
          id: doc.id, 
          ...data
        };
      });
      
      setEmpleados(empleadosList);
      showMessage(`Empleados cargados correctamente (${empleadosList.length} encontrados)`, 'success');
    } catch (error) {
      logger.error('Error fetching empleados:', error);
      showMessage(`Error al cargar empleados: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchEmpleados();
  }, [fetchEmpleados]);

  // Manejar cambios en campos básicos
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // Manejar cambios en sub-objetos
  const handleFormacionChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      formacion: { ...prev.formacion, [name]: value }
    }));
  }, []);

  const handleSeguridadSaludChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      seguridad_salud: { ...prev.seguridad_salud, [name]: value }
    }));
  }, []);

  const handleContactoChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      contacto: { ...prev.contacto, [name]: value }
    }));
  }, []);

  // Funciones para arrays
  const handleAddCompetencia = useCallback(() => {
    if (competenciaInput.trim()) {
      setForm(prev => ({
        ...prev,
        competencias: [...prev.competencias, competenciaInput.trim()]
      }));
      setCompetenciaInput('');
    }
  }, [competenciaInput]);

  const handleRemoveCompetencia = useCallback((index) => {
    setForm(prev => ({
      ...prev,
      competencias: prev.competencias.filter((_, i) => i !== index)
    }));
  }, []);

  const handleAddCertificacion = useCallback(() => {
    if (certificacion.nombre && certificacion.entidad) {
      setForm(prev => ({
        ...prev,
        formacion: {
          ...prev.formacion,
          certificaciones: [...prev.formacion.certificaciones, certificacion]
        }
      }));
      setCertificacion({ nombre: '', entidad: '', fecha_emision: '', fecha_vencimiento: '' });
    }
  }, [certificacion]);

  const handleAddEvaluacion = useCallback(() => {
    if (evaluacion.fecha && evaluacion.evaluador && evaluacion.resultado) {
      setForm(prev => ({
        ...prev,
        evaluaciones: [...prev.evaluaciones, evaluacion]
      }));
      setEvaluacion({ fecha: '', evaluador: '', resultado: '', observaciones: '' });
    }
  }, [evaluacion]);

  const handleAddDocumento = useCallback(() => {
    if (documento.tipo && documento.url) {
      const newDoc = {
        ...documento,
        fecha_subida: documento.fecha_subida || new Date().toISOString().split('T')[0]
      };
      setForm(prev => ({
        ...prev,
        documentos: [...prev.documentos, newDoc]
      }));
      setDocumento({ tipo: '', url: '', fecha_subida: '' });
    }
  }, [documento]);

  // Validar formulario
  const validateForm = useCallback(() => {
    const required = ['nombre_completo', 'identificacion', 'tipo_empleado', 'cargo', 'fecha_ingreso'];
    const missing = required.filter(field => !form[field]?.trim());
    
    if (missing.length > 0) {
      showMessage(`Campos obligatorios faltantes: ${missing.join(', ')}`, 'error');
      return false;
    }
    return true;
  }, [form, showMessage]);

  // Guardar empleado
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const empleadoData = {
        ...form,
        fecha_actualizacion: serverTimestamp(),
        ...(editingId ? {} : { fecha_creacion: serverTimestamp() })
      };

      const empleadoId = editingId || form.identificacion;

      if (editingId) {
        await updateDoc(doc(db, 'EMPLEADOS', editingId), empleadoData);
        showMessage('Empleado actualizado correctamente', 'success');
        setEditingId(null);
      } else {
        await setDoc(doc(db, 'EMPLEADOS', empleadoId), empleadoData);
        showMessage('Empleado registrado correctamente', 'success');
      }
      
      setForm(initialForm);
      setShowForm(false);
      setActiveSection('basicos');
      fetchEmpleados();
    } catch (error) {
      console.error('Error saving empleado:', error);
      if (error.code === 'already-exists') {
        showMessage('Ya existe un empleado con esa identificación', 'error');
      } else {
        showMessage('Error al guardar empleado', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [form, editingId, validateForm, showMessage, fetchEmpleados]);

  // Editar empleado
  const handleEdit = useCallback((empleado) => {
    setEditingId(empleado.id);
    setForm(empleado);
    setShowForm(true);
    setActiveSection('basicos');
  }, []);

  // Eliminar empleado
  const handleDelete = useCallback(async (id, nombre) => {
    if (window.confirm(`¿Seguro que deseas eliminar al empleado "${nombre}"?`)) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'EMPLEADOS', id));
        showMessage('Empleado eliminado correctamente', 'success');
        fetchEmpleados();
      } catch (error) {
        console.error('Error deleting empleado:', error);
        showMessage('Error al eliminar empleado', 'error');
      } finally {
        setLoading(false);
      }
    }
  }, [showMessage, fetchEmpleados]);

  // Cancelar edición
  const handleCancel = useCallback(() => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(false);
    setActiveSection('basicos');
  }, []);

  // Filtrar empleados
  const filteredEmpleados = useMemo(() => {
    return empleados.filter(empleado => {
      const matchesSearch = !searchTerm || 
        Object.values(empleado).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesTipo = filterTipo === 'todos' || empleado.tipo_empleado === filterTipo;
      const matchesEstado = filterEstado === 'todos' || empleado.estado === filterEstado;
      
      return matchesSearch && matchesTipo && matchesEstado;
    });
  }, [empleados, searchTerm, filterTipo, filterEstado]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = empleados.length;
    const activos = empleados.filter(e => e.estado === 'activo').length;
    const tecnicos = empleados.filter(e => e.tipo_empleado === 'tecnico').length;
    const administrativos = empleados.filter(e => e.tipo_empleado === 'administrativo').length;
    const directivos = empleados.filter(e => e.tipo_empleado === 'directivo').length;
    
    return { total, activos, tecnicos, administrativos, directivos };
  }, [empleados]);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
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
          👥 Gestión de Empleados
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchEmpleados}
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
            {showForm ? '❌ Cancelar' : '➕ Nuevo Empleado'}
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
        <StatCard title="Total Empleados" value={stats.total} color={THEME_COLORS.primary} />
        <StatCard title="Activos" value={stats.activos} color={THEME_COLORS.success} />
        <StatCard title="Técnicos" value={stats.tecnicos} color={THEME_COLORS.info} />
        <StatCard title="Administrativos" value={stats.administrativos} color={THEME_COLORS.warning} />
        <StatCard title="Directivos" value={stats.directivos} color={THEME_COLORS.danger} />
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
            {editingId ? '✏️ Editar Empleado' : '➕ Nuevo Empleado'}
          </h3>

          {/* Navegación entre secciones */}
          <div style={{ 
            display: 'flex', 
            marginBottom: '20px', 
            borderBottom: '1px solid #ddd',
            gap: '10px'
          }}>
            {[
              { key: 'basicos', label: '📝 Básicos', icon: '📝' },
              { key: 'formacion', label: '🎓 Formación', icon: '🎓' },
              { key: 'salud', label: '🏥 Salud', icon: '🏥' },
              { key: 'contacto', label: '📞 Contacto', icon: '📞' },
              { key: 'documentos', label: '📄 Documentos', icon: '📄' }
            ].map(section => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                style={{
                  backgroundColor: activeSection === section.key ? THEME_COLORS.primary : 'transparent',
                  color: activeSection === section.key ? 'white' : THEME_COLORS.primary,
                  border: `2px solid ${THEME_COLORS.primary}`,
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
              >
                {section.label}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Sección Básicos */}
            {activeSection === 'basicos' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                <FormField
                  label="Nombre Completo *"
                  name="nombre_completo"
                  value={form.nombre_completo}
                  onChange={handleChange}
                  placeholder="Nombre completo del empleado"
                />
                
                <FormField
                  label="Identificación *"
                  name="identificacion"
                  value={form.identificacion}
                  onChange={handleChange}
                  placeholder="Número de identificación"
                  disabled={!!editingId}
                />
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Tipo de Empleado *
                  </label>
                  <select
                    name="tipo_empleado"
                    value={form.tipo_empleado}
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
                    {TIPOS_EMPLEADO.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <FormField
                  label="Cargo *"
                  name="cargo"
                  value={form.cargo}
                  onChange={handleChange}
                  placeholder="Cargo que desempeña"
                />
                
                <FormField
                  label="Fecha de Ingreso *"
                  name="fecha_ingreso"
                  type="date"
                  value={form.fecha_ingreso}
                  onChange={handleChange}
                />
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Estado
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
                  >
                    {ESTADOS_EMPLEADO.map(estado => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Sección Formación */}
            {activeSection === 'formacion' && (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Nivel Académico
                  </label>
                  <select
                    name="nivel_academico"
                    value={form.formacion.nivel_academico}
                    onChange={handleFormacionChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Seleccionar nivel académico</option>
                    {NIVELES_ACADEMICOS.map(nivel => (
                      <option key={nivel} value={nivel}>{nivel}</option>
                    ))}
                  </select>
                </div>

                {/* Competencias */}
                <SectionCard title="💪 Competencias">
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      value={competenciaInput}
                      onChange={(e) => setCompetenciaInput(e.target.value)}
                      placeholder="Agregar competencia"
                      style={inputStyle}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCompetencia())}
                    />
                    <button type="button" onClick={handleAddCompetencia} style={addButtonStyle}>
                      ➕
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {form.competencias.map((competencia, index) => (
                      <span key={index} style={tagStyle}>
                        {competencia}
                        <button
                          type="button"
                          onClick={() => handleRemoveCompetencia(index)}
                          style={removeTagStyle}
                        >
                          ❌
                        </button>
                      </span>
                    ))}
                  </div>
                </SectionCard>

                {/* Certificaciones */}
                <SectionCard title="🏆 Certificaciones">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                    <input
                      placeholder="Nombre certificación"
                      value={certificacion.nombre}
                      onChange={(e) => setCertificacion({...certificacion, nombre: e.target.value})}
                      style={inputStyle}
                    />
                    <input
                      placeholder="Entidad emisora"
                      value={certificacion.entidad}
                      onChange={(e) => setCertificacion({...certificacion, entidad: e.target.value})}
                      style={inputStyle}
                    />
                    <input
                      type="date"
                      placeholder="Fecha emisión"
                      value={certificacion.fecha_emision}
                      onChange={(e) => setCertificacion({...certificacion, fecha_emision: e.target.value})}
                      style={inputStyle}
                    />
                    <input
                      type="date"
                      placeholder="Fecha vencimiento"
                      value={certificacion.fecha_vencimiento}
                      onChange={(e) => setCertificacion({...certificacion, fecha_vencimiento: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                  <button type="button" onClick={handleAddCertificacion} style={addButtonStyle}>
                    ➕ Agregar Certificación
                  </button>
                  <div style={{ marginTop: '10px' }}>
                    {form.formacion.certificaciones.map((cert, index) => (
                      <div key={index} style={listItemStyle}>
                        <strong>{cert.nombre}</strong> - {cert.entidad}
                        <br />
                        <small>📅 {cert.fecha_emision} → {cert.fecha_vencimiento}</small>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Evaluaciones */}
                <SectionCard title="📊 Evaluaciones">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="date"
                      placeholder="Fecha evaluación"
                      value={evaluacion.fecha}
                      onChange={(e) => setEvaluacion({...evaluacion, fecha: e.target.value})}
                      style={inputStyle}
                    />
                    <input
                      placeholder="Evaluador"
                      value={evaluacion.evaluador}
                      onChange={(e) => setEvaluacion({...evaluacion, evaluador: e.target.value})}
                      style={inputStyle}
                    />
                    <input
                      placeholder="Resultado"
                      value={evaluacion.resultado}
                      onChange={(e) => setEvaluacion({...evaluacion, resultado: e.target.value})}
                      style={inputStyle}
                    />
                    <input
                      placeholder="Observaciones"
                      value={evaluacion.observaciones}
                      onChange={(e) => setEvaluacion({...evaluacion, observaciones: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                  <button type="button" onClick={handleAddEvaluacion} style={addButtonStyle}>
                    ➕ Agregar Evaluación
                  </button>
                  <div style={{ marginTop: '10px' }}>
                    {form.evaluaciones.map((evaluacionItem, index) => (
                      <div key={index} style={listItemStyle}>
                        <strong>📅 {evaluacionItem.fecha}</strong> - Evaluador: {evaluacionItem.evaluador}
                        <br />
                        <strong>Resultado:</strong> {evaluacionItem.resultado}
                        {evaluacionItem.observaciones && <><br /><em>{evaluacionItem.observaciones}</em></>}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* Sección Salud */}
            {activeSection === 'salud' && (
              <SectionCard title="🏥 Seguridad y Salud Ocupacional">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                  <FormField
                    label="EPS"
                    name="eps"
                    value={form.seguridad_salud.eps}
                    onChange={handleSeguridadSaludChange}
                    placeholder="Entidad Promotora de Salud"
                  />
                  
                  <FormField
                    label="ARL"
                    name="arl"
                    value={form.seguridad_salud.arl}
                    onChange={handleSeguridadSaludChange}
                    placeholder="Administradora de Riesgos Laborales"
                  />
                  
                  <FormField
                    label="Examen Médico de Ingreso"
                    name="examen_medico_ingreso"
                    type="date"
                    value={form.seguridad_salud.examen_medico_ingreso}
                    onChange={handleSeguridadSaludChange}
                  />
                  
                  <FormField
                    label="Último Examen Médico"
                    name="ultimo_examen_medico"
                    type="date"
                    value={form.seguridad_salud.ultimo_examen_medico}
                    onChange={handleSeguridadSaludChange}
                  />
                  
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FormField
                      label="Restricciones Médicas"
                      name="restricciones"
                      value={form.seguridad_salud.restricciones}
                      onChange={handleSeguridadSaludChange}
                      placeholder="Restricciones o recomendaciones médicas"
                    />
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Sección Contacto */}
            {activeSection === 'contacto' && (
              <SectionCard title="📞 Información de Contacto">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                  <FormField
                    label="Teléfono"
                    name="telefono"
                    value={form.contacto.telefono}
                    onChange={handleContactoChange}
                    placeholder="Número de teléfono"
                  />
                  
                  <FormField
                    label="Correo Electrónico"
                    name="correo"
                    type="email"
                    value={form.contacto.correo}
                    onChange={handleContactoChange}
                    placeholder="correo@ejemplo.com"
                  />
                  
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FormField
                      label="Dirección"
                      name="direccion"
                      value={form.contacto.direccion}
                      onChange={handleContactoChange}
                      placeholder="Dirección de residencia"
                    />
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Sección Documentos */}
            {activeSection === 'documentos' && (
              <SectionCard title="📄 Documentos">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <select
                    value={documento.tipo}
                    onChange={(e) => setDocumento({...documento, tipo: e.target.value})}
                    style={inputStyle}
                  >
                    <option value="">Tipo de documento</option>
                    {TIPOS_DOCUMENTO.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  <input
                    placeholder="URL del documento"
                    value={documento.url}
                    onChange={(e) => setDocumento({...documento, url: e.target.value})}
                    style={inputStyle}
                  />
                  <input
                    type="date"
                    placeholder="Fecha de subida"
                    value={documento.fecha_subida}
                    onChange={(e) => setDocumento({...documento, fecha_subida: e.target.value})}
                    style={inputStyle}
                  />
                </div>
                <button type="button" onClick={handleAddDocumento} style={addButtonStyle}>
                  ➕ Agregar Documento
                </button>
                <div style={{ marginTop: '10px' }}>
                  {form.documentos.map((doc, index) => (
                    <div key={index} style={listItemStyle}>
                      <strong>📄 {doc.tipo}</strong>
                      <br />
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: THEME_COLORS.primary }}>
                        Ver documento 🔗
                      </a>
                      <br />
                      <small>📅 Subido: {doc.fecha_subida}</small>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '30px' }}>
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
                {loading ? 'Guardando...' : (editingId ? 'Actualizar Empleado' : 'Registrar Empleado')}
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
          placeholder="🔍 Buscar empleados..."
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
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          style={{
            padding: '10px 15px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="todos">Todos los tipos</option>
          {TIPOS_EMPLEADO.map(tipo => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </select>

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
          {ESTADOS_EMPLEADO.map(estado => (
            <option key={estado.value} value={estado.value}>
              {estado.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de empleados */}
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
          <h3 style={{ margin: 0 }}>Listado de Empleados ({filteredEmpleados.length})</h3>
          {loading && <span>🔄 Cargando...</span>}
        </div>
        
        {filteredEmpleados.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            {empleados.length === 0 ? '👥 No hay empleados registrados' : '🔍 No se encontraron empleados con los filtros aplicados'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={tableHeaderStyle}>Nombre</th>
                  <th style={tableHeaderStyle}>Identificación</th>
                  <th style={tableHeaderStyle}>Tipo</th>
                  <th style={tableHeaderStyle}>Cargo</th>
                  <th style={tableHeaderStyle}>Estado</th>
                  <th style={tableHeaderStyle}>Teléfono</th>
                  <th style={tableHeaderStyle}>Fecha Ingreso</th>
                  <th style={tableHeaderStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmpleados.map((empleado, index) => (
                  <tr key={empleado.id} style={{ 
                    backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                    transition: 'background-color 0.2s ease'
                  }}>
                    <td style={tableCellStyle}>{empleado.nombre_completo}</td>
                    <td style={tableCellStyle}>{empleado.identificacion}</td>
                    <td style={tableCellStyle}>
                      <TipoBadge tipo={empleado.tipo_empleado} />
                    </td>
                    <td style={tableCellStyle}>{empleado.cargo}</td>
                    <td style={tableCellStyle}>
                      <EstadoBadge estado={empleado.estado} />
                    </td>
                    <td style={tableCellStyle}>{empleado.contacto?.telefono || '-'}</td>
                    <td style={tableCellStyle}>
                      {empleado.fecha_ingreso ? 
                        new Date(empleado.fecha_ingreso).toLocaleDateString('es-ES') : 
                        '-'
                      }
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handleEdit(empleado)}
                          style={{
                            backgroundColor: THEME_COLORS.info,
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="Editar empleado"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(empleado.id, empleado.nombre_completo)}
                          style={{
                            backgroundColor: THEME_COLORS.danger,
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="Eliminar empleado"
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

// Componentes auxiliares
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

const SectionCard = ({ title, children }) => (
  <div style={{
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: 'white'
  }}>
    <h4 style={{ margin: '0 0 15px 0', color: THEME_COLORS.primary }}>
      {title}
    </h4>
    {children}
  </div>
);

const TipoBadge = ({ tipo }) => {
  const tipoConfig = TIPOS_EMPLEADO.find(t => t.value === tipo) || 
    { label: tipo, color: THEME_COLORS.secondary };
  
  return (
    <span style={{
      backgroundColor: tipoConfig.color,
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold'
    }}>
      {tipoConfig.label}
    </span>
  );
};

const EstadoBadge = ({ estado }) => {
  const estadoConfig = ESTADOS_EMPLEADO.find(e => e.value === estado) || 
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

// Estilos
const inputStyle = {
  width: '100%',
  padding: '8px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px'
};

const addButtonStyle = {
  backgroundColor: THEME_COLORS.success,
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px'
};

const tagStyle = {
  backgroundColor: THEME_COLORS.primary,
  color: 'white',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px'
};

const removeTagStyle = {
  background: 'none',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  fontSize: '10px'
};

const listItemStyle = {
  backgroundColor: '#f8f9fa',
  padding: '10px',
  marginBottom: '5px',
  borderRadius: '4px',
  border: '1px solid #dee2e6'
};

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

export default Empleados;
