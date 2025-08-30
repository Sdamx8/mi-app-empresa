// components/FormularioRemision.js - Formulario para nueva remisión con campos según especificación
import React, { memo, useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { THEME_COLORS } from '../constants';

// Opciones fijas para dropdowns
const ESTADOS_REMISION = [
  { value: 'CANCELADO', label: 'CANCELADO' },
  { value: 'CORTECIA', label: 'CORTECIA' },
  { value: 'GARANTIA', label: 'GARANTIA' },
  { value: 'GENERADO', label: 'GENERADO' },
  { value: 'PENDIENTE', label: 'PENDIENTE' },
  { value: 'PROFORMA', label: 'PROFORMA' },
  { value: 'RADICADO', label: 'RADICADO' },
  { value: 'SIN VINCULAR', label: 'SIN VINCULAR' }
];

const OPCIONES_CARROCERIA = [
  { value: 'AGRALE-MA8.7', label: 'AGRALE-MA8.7' },
  { value: 'CHEVROLET-NPR', label: 'CHEVROLET-NPR' },
  { value: 'MERCEDES-ATEGO-1016', label: 'MERCEDES-ATEGO-1016' },
  { value: 'MERCEDES-LO-915', label: 'MERCEDES-LO-915' },
  { value: 'MERCEDES-OF 1724', label: 'MERCEDES-OF 1724' },
  { value: 'SCANIA - K250 B4X2', label: 'SCANIA - K250 B4X2' },
  { value: 'THOMAS-EF1723', label: 'THOMAS-EF1723' },
  { value: 'VOLVO-B215RH', label: 'VOLVO-B215RH' }
];

const OPCIONES_UNE = [
  { value: 'ALIMENTADORES', label: 'ALIMENTADORES' },
  { value: 'AUTOSUR', label: 'AUTOSUR' },
  { value: 'GALICIA', label: 'GALICIA' },
  { value: 'SANBERNARDINO', label: 'SANBERNARDINO' },
  { value: 'SANJOSE1', label: 'SANJOSE1' },
  { value: 'SANJOSE2', label: 'SANJOSE2' },
  { value: 'SEVILLANA', label: 'SEVILLANA' }
];

const FormularioRemision = memo(({ isOpen, onClose, onSave, initialData = null }) => {
  const { user } = useAuth();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    remision: '',
    autorizo: '',
    carroceria: '',
    descripcion: [], // mantenemos para compatibilidad con backend
    servicios: [], // nueva estructura: array de objetos {id, titulo, costo}
    estado: 'GENERADO',
    fecha_remision: '',
    fecha_bit_prof: '',
    fecha_maximo: '',
    radicacion: '',
    no_id_bit: '',
    no_fact_elect: '',
    no_orden: '',
    movil: '',
    genero: '',
    tecnico: [],
    subtotal: '0',
    total: '0',
    une: 'SANJOSE1'
  });

  // Estados auxiliares
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [servicios, setServicios] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);

  // Cargar empleado actual
  const cargarEmpleadoActual = useCallback(async () => {
    console.log('🔍 Cargando empleado actual:', user?.email);
    if (!user?.email) {
      console.log('❌ No hay email de usuario');
      return;
    }
    
    try {
      const empleadosRef = collection(db, 'EMPLEADOS');
      
      // Intentar búsqueda por contacto.correo
      let q = query(empleadosRef, where('contacto.correo', '==', user.email));
      let snapshot = await getDocs(q);
      
      console.log('📊 Empleados encontrados con contacto.correo:', snapshot.size);
      
      // Si no encuentra, intentar búsqueda directa por email (por si la estructura es diferente)
      if (snapshot.empty) {
        console.log('🔄 Intentando búsqueda alternativa por email...');
        q = query(empleadosRef, where('email', '==', user.email));
        snapshot = await getDocs(q);
        console.log('📊 Empleados encontrados con email:', snapshot.size);
      }
      
      // Si aún no encuentra, buscar por correo sin anidamiento
      if (snapshot.empty) {
        console.log('� Intentando búsqueda por correo...');
        q = query(empleadosRef, where('correo', '==', user.email));
        snapshot = await getDocs(q);
        console.log('�📊 Empleados encontrados con correo:', snapshot.size);
      }
      
      if (!snapshot.empty) {
        const empleadoData = snapshot.docs[0].data();
        console.log('👤 Datos del empleado encontrado:', empleadoData);
        setFormData(prev => ({
          ...prev,
          genero: empleadoData.nombre_completo || ''
        }));
        console.log('✅ Campo genero actualizado:', empleadoData.nombre_completo);
      } else {
        console.log('❌ No se encontró empleado con correo:', user.email);
        console.log('💡 Emails disponibles en la colección empleados:');
        
        // Mostrar todos los emails para debug
        const allSnapshot = await getDocs(empleadosRef);
        allSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📧', {
            id: doc.id,
            nombre: data.nombre_completo,
            contacto_correo: data.contacto?.correo,
            email: data.email,
            correo: data.correo
          });
        });
      }
    } catch (error) {
      console.error('Error cargando empleado actual:', error);
    }
  }, [user]);

  // Cargar servicios desde Firestore
  const cargarServicios = useCallback(async () => {
    try {
      setLoadingServicios(true);
      const serviciosRef = collection(db, 'servicios');
      const snapshot = await getDocs(serviciosRef);
      
      const serviciosData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        serviciosData.push({
          id: doc.id,
          titulo: data.titulo || '',
          costo: data.costo || '0',
          value: data.titulo || '',
          label: data.titulo || ''
        });
      });
      
      setServicios(serviciosData);
    } catch (error) {
      console.error('Error cargando servicios:', error);
    } finally {
      setLoadingServicios(false);
    }
  }, []);

  // Cargar técnicos desde Firestore
  const cargarTecnicos = useCallback(async () => {
    console.log('🔧 Iniciando carga de técnicos...');
    try {
      setLoadingTecnicos(true);
      
      // Intentar con colección 'EMPLEADOS' primero
      let empleadosRef = collection(db, 'EMPLEADOS');
      let q = query(empleadosRef, where('tipo_empleado', '==', 'tecnico'));
      let snapshot = await getDocs(q);
      
      console.log('📊 Búsqueda en EMPLEADOS - técnicos encontrados:', snapshot.size);

      // Si no encuentra, intentar con 'empleados' (minúscula)
      if (snapshot.empty) {
        console.log('🔄 Intentando con colección empleados (minúscula)...');
        empleadosRef = collection(db, 'empleados');
        q = query(empleadosRef, where('tipo_empleado', '==', 'tecnico'));
        snapshot = await getDocs(q);
        console.log('📊 Búsqueda en empleados - técnicos encontrados:', snapshot.size);
      }
      
      const tecnicosData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('👷 Técnico encontrado:', {
          id: doc.id,
          nombre_completo: data.nombre_completo,
          tipo_empleado: data.tipo_empleado,
          cargo: data.cargo
        });
        
        if (data.nombre_completo) {
          tecnicosData.push({
            id: doc.id,
            nombre: data.nombre_completo,
            value: data.nombre_completo,
            label: data.nombre_completo
          });
        }
      });

      // Si no hay resultados, hacer fallback
      if (tecnicosData.length === 0) {
        console.log('🔄 Consulta directa sin resultados, iniciando fallback...');
        
        // Probar ambas colecciones para el fallback
        const collections = ['EMPLEADOS', 'empleados'];

        for (const collectionName of collections) {
          if (tecnicosData.length > 0) break;
          
          try {
            const allSnap = await getDocs(collection(db, collectionName));
            console.log(`📊 Fallback en ${collectionName} - total empleados:`, allSnap.size);

            allSnap.forEach((doc) => {
              const data = doc.data();
              const tipo = (data.tipo_empleado || '').toString().toLowerCase();
              const cargo = (data.cargo || '').toString().toLowerCase();
              
              // Filtro: tipo_empleado o cargo que contenga 'tecnico'
              const esTecnico = tipo === 'tecnico' || cargo.includes('tecnico');
              
              console.log('🔍 Evaluando empleado:', {
                id: doc.id,
                nombre: data.nombre_completo,
                tipo_empleado: data.tipo_empleado,
                cargo: data.cargo,
                esTecnico
              });

              if (data.nombre_completo && esTecnico) {
                tecnicosData.push({
                  id: doc.id,
                  nombre: data.nombre_completo,
                  value: data.nombre_completo,
                  label: data.nombre_completo
                });
                console.log('✅ Técnico agregado al fallback:', data.nombre_completo);
              }
            });
          } catch (collErr) {
            console.log(`⚠️ No se pudo acceder a colección ${collectionName}:`, collErr.message);
          }
        }
      }

      console.log('📋 Lista final de técnicos:', tecnicosData.map(t => `${t.id}: ${t.nombre}`));
      console.log('✅ Total técnicos cargados:', tecnicosData.length);
      
      setTecnicos(tecnicosData);

      // Advertencias útiles
      if (tecnicosData.length === 0) {
        console.warn('⚠️ No se encontraron técnicos. Verifique:');
        console.warn('   1. Que existan empleados con tipo_empleado="tecnico"');
        console.warn('   2. Que los nombres de campos sean exactos (case-sensitive)');
        console.warn('   3. Permisos de lectura en las colecciones de empleados');
      }

    } catch (error) {
      console.error('❌ Error cargando técnicos:', error);
      
      // Manejar errores específicos
      if (error.code === 'failed-precondition') {
        console.error('📋 ERROR DE ÍNDICE: Necesita crear un índice compuesto en Firebase Console:');
        console.error('   Colección: EMPLEADOS (o empleados)');
        console.error('   Campos: tipo_empleado (Ascending), nombre_completo (Ascending)');
        console.error('   🔗 Vaya a: Firebase Console > Firestore > Indexes > Create Index');
      } else if (error.code === 'permission-denied') {
        console.error('🚫 Error de permisos: Verifique las reglas de Firestore para las colecciones de empleados');
      } else {
        console.error('🔥 Error desconocido:', error.message);
      }
      
      setTecnicos([]);
    } finally {
      setLoadingTecnicos(false);
      console.log('🏁 cargarTecnicos: Proceso finalizado');
    }
  }, []);

  // Calcular subtotal y total
  const calcularTotales = useCallback(() => {
    let subtotalCalculado = 0;
    
    // Usar la nueva estructura de servicios
    formData.servicios.forEach(servicio => {
      subtotalCalculado += parseFloat(servicio.costo || '0');
    });
    
    const totalCalculado = subtotalCalculado + (subtotalCalculado * 0.19);
    
    setFormData(prev => ({
      ...prev,
      subtotal: Math.round(subtotalCalculado).toString(),
      total: Math.round(totalCalculado).toString()
    }));
  }, [formData.servicios]);

  // Formatear número para visualización
  const formatearNumero = (valor) => {
    if (!valor) return '0';
    const num = parseFloat(valor);
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('es-CO').format(num);
  };

  // Formatear fecha a DD/MM/YYYY
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return '';
    
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const año = date.getFullYear();
    
    return `${dia}/${mes}/${año}`;
  };

  // Validar formulario
  const validarFormulario = () => {
    const newErrors = {};
    
    if (!formData.remision.trim()) {
      newErrors.remision = 'El número de remisión es obligatorio';
    }
    
    if (!formData.fecha_remision) {
      newErrors.fecha_remision = 'La fecha de remisión es obligatoria';
    }
    
    if (!formData.movil.trim()) {
      newErrors.movil = 'El móvil es obligatorio';
    }
    
    if (formData.servicios.length === 0) {
      newErrors.servicios = 'Debe seleccionar al menos un servicio';
    }
    
    if (formData.tecnico.length === 0) {
      newErrors.tecnico = 'Debe seleccionar al menos un técnico';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar remisión
  const handleSave = async () => {
    if (!validarFormulario()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Preparar datos para Firestore
      const dataToSave = {
        remision: formData.remision.trim(),
        autorizo: formData.autorizo,
        carroceria: formData.carroceria,
        // Mantener compatibilidad con estructura anterior
        descripcion: formData.servicios.map(s => s.titulo),
        // Nueva estructura más rica
        servicios: formData.servicios,
        estado: formData.estado,
        fecha_remision: formatearFecha(formData.fecha_remision),
        fecha_remision_ts: formData.fecha_remision ? new Date(formData.fecha_remision) : null,
        fecha_bit_prof: formatearFecha(formData.fecha_bit_prof),
        fecha_bit_prof_ts: formData.fecha_bit_prof ? new Date(formData.fecha_bit_prof) : null,
        fecha_maximo: formatearFecha(formData.fecha_maximo),
        fecha_maximo_ts: formData.fecha_maximo ? new Date(formData.fecha_maximo) : null,
        radicacion: formatearFecha(formData.radicacion),
        radicacion_ts: formData.radicacion ? new Date(formData.radicacion) : null,
        no_id_bit: formData.no_id_bit.trim(),
        no_fact_elect: formData.no_fact_elect.trim(),
        no_orden: formData.no_orden.trim(),
        movil: formData.movil.trim(),
        genero: formData.genero,
        tecnico: formData.tecnico,
        subtotal: formData.subtotal,
        total: formData.total,
        une: formData.une,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      if (initialData?.id) {
        // Actualizar documento existente
        await updateDoc(doc(db, 'remisiones', initialData.id), {
          ...dataToSave,
          updated_at: serverTimestamp()
        });
        
        onSave({
          success: true,
          message: `Remisión ${formData.remision} actualizada exitosamente`,
          id: initialData.id,
          numeroRemision: formData.remision
        });
      } else {
        // Crear nuevo documento con ID igual al número de remisión
        const docRef = doc(db, 'remisiones', formData.remision.trim());
        await setDoc(docRef, dataToSave);
        
        onSave({
          success: true,
          message: `Remisión ${formData.remision} creada exitosamente`,
          id: formData.remision,
          numeroRemision: formData.remision
        });
      }
      
      resetForm();
      onClose();
      
    } catch (error) {
      console.error('Error guardando remisión:', error);
      setErrors({
        general: 'Error al guardar la remisión. Por favor intente nuevamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Resetear formulario
  const resetForm = useCallback(() => {
    setFormData({
      remision: '',
      autorizo: '',
      carroceria: '',
      descripcion: [],
      servicios: [],
      estado: 'GENERADO',
      fecha_remision: '',
      fecha_bit_prof: '',
      fecha_maximo: '',
      radicacion: '',
      no_id_bit: '',
      no_fact_elect: '',
      no_orden: '',
      movil: '',
      genero: '',
      tecnico: [],
      subtotal: '0',
      total: '0',
      une: 'SANJOSE1'
    });
    setErrors({});
  }, []);

  // Actualizar campo del formulario
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  // Manejar teclas
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  // Efectos
  useEffect(() => {
    console.log('🔄 useEffect ejecutado:', { isOpen, hasInitialData: !!initialData?.id });
    
    if (isOpen) {
      console.log('🚀 Modal abierto, cargando datos...');
      cargarServicios();
      cargarTecnicos();
      
      if (initialData?.id) {
        console.log('📝 Editando remisión existente:', initialData.id);
        // Cargar datos existentes
        const serviciosExistentes = initialData.servicios || 
          (initialData.descripcion || []).map(titulo => {
            const servicio = servicios.find(s => s.titulo === titulo);
            return servicio ? { id: servicio.id, titulo: servicio.titulo, costo: servicio.costo } : null;
          }).filter(Boolean);

        setFormData({
          remision: initialData.remision || '',
          autorizo: initialData.autorizo || '',
          carroceria: initialData.carroceria || '',
          descripcion: initialData.descripcion || [],
          servicios: serviciosExistentes,
          estado: initialData.estado || 'GENERADO',
          fecha_remision: initialData.fecha_remision || '',
          fecha_bit_prof: initialData.fecha_bit_prof || '',
          fecha_maximo: initialData.fecha_maximo || '',
          radicacion: initialData.radicacion || '',
          no_id_bit: initialData.no_id_bit || '',
          no_fact_elect: initialData.no_fact_elect || '',
          no_orden: initialData.no_orden || '',
          movil: initialData.movil || '',
          genero: initialData.genero || '',
          tecnico: initialData.tecnico || [],
          subtotal: initialData.subtotal || '0',
          total: initialData.total || '0',
          une: initialData.une || 'SANJOSE1'
        });
      } else {
        console.log('✨ Creando nueva remisión...');
        resetForm();
        // Cargar empleado actual solo para nuevas remisiones
        cargarEmpleadoActual();
      }
    }
  }, [isOpen, initialData, cargarServicios, cargarTecnicos, cargarEmpleadoActual, resetForm]);

  // Recalcular totales cuando cambian los servicios seleccionados
  useEffect(() => {
    if (servicios.length > 0) {
      calcularTotales();
    }
  }, [formData.servicios, servicios, calcularTotales]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      onClick={(e) => e.target.className === 'modal-overlay' && onClose()}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <div 
        className="modal-content"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: `2px solid ${THEME_COLORS.primary}`
          }}
        >
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            color: THEME_COLORS.text
          }}>
            {initialData?.id ? 'Editar Remisión' : 'Nueva Remisión'}
          </h2>
          
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: THEME_COLORS.textSecondary,
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Error general */}
        {errors.general && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#dc2626'
          }}>
            {errors.general}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={(e) => e.preventDefault()}>
          {/* Primera fila: Remisión, Autorizado por, Estado */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {/* Número de Remisión */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                Número de Remisión *
              </label>
              <input
                type="text"
                value={formData.remision}
                onChange={(e) => updateField('remision', e.target.value)}
                placeholder="Ej: REM-001"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `2px solid ${errors.remision ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = THEME_COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = errors.remision ? '#dc2626' : '#d1d5db'}
              />
              {errors.remision && (
                <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                  {errors.remision}
                </p>
              )}
            </div>

            {/* Autorizado por */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                Autorizado por
              </label>
              <input
                type="text"
                value={formData.autorizo}
                onChange={(e) => updateField('autorizo', e.target.value)}
                placeholder="Ej: FABIAN GIRALDO"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = THEME_COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Estado */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) => updateField('estado', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {ESTADOS_REMISION.map(estado => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Segunda fila: Carrocería, UNE, Móvil */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {/* Carrocería */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                Carrocería
              </label>
              <select
                value={formData.carroceria}
                onChange={(e) => updateField('carroceria', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">Seleccionar carrocería</option>
                {OPCIONES_CARROCERIA.map(opcion => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>

            {/* UNE */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                UNE
              </label>
              <select
                value={formData.une}
                onChange={(e) => updateField('une', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {OPCIONES_UNE.map(opcion => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Móvil */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                Móvil *
              </label>
              <input
                type="text"
                value={formData.movil}
                onChange={(e) => updateField('movil', e.target.value)}
                placeholder="Ej: MOV-001"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `2px solid ${errors.movil ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = THEME_COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = errors.movil ? '#dc2626' : '#d1d5db'}
              />
              {errors.movil && (
                <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                  {errors.movil}
                </p>
              )}
            </div>
          </div>

          {/* Tercera fila: Fechas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {/* Fecha Remisión */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                Fecha Remisión *
              </label>
              <input
                type="date"
                value={formData.fecha_remision}
                onChange={(e) => updateField('fecha_remision', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `2px solid ${errors.fecha_remision ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = THEME_COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = errors.fecha_remision ? '#dc2626' : '#d1d5db'}
              />
              {errors.fecha_remision && (
                <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                  {errors.fecha_remision}
                </p>
              )}
            </div>

            {/* Fecha BIT Proforma */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                Fecha BIT Proforma
              </label>
              <input
                type="date"
                value={formData.fecha_bit_prof}
                onChange={(e) => updateField('fecha_bit_prof', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = THEME_COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Fecha Máximo */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                Fecha Máximo
              </label>
              <input
                type="date"
                value={formData.fecha_maximo}
                onChange={(e) => updateField('fecha_maximo', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = THEME_COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Radicación */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                Radicación
              </label>
              <input
                type="date"
                value={formData.radicacion}
                onChange={(e) => updateField('radicacion', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = THEME_COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>

          {/* Cuarta fila: Números de control */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {/* Número ID BIT */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                Número ID BIT
              </label>
              <input
                type="text"
                value={formData.no_id_bit}
                onChange={(e) => updateField('no_id_bit', e.target.value)}
                placeholder="Ej: BIT-001"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = THEME_COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Número Factura Electrónica */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                No. Fact. Electrónica
              </label>
              <input
                type="text"
                value={formData.no_fact_elect}
                onChange={(e) => updateField('no_fact_elect', e.target.value)}
                placeholder="Ej: FE-001"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = THEME_COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Número de Orden */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                No. de Orden
              </label>
              <input
                type="text"
                value={formData.no_orden}
                onChange={(e) => updateField('no_orden', e.target.value)}
                placeholder="Ej: ORD-001"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = THEME_COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Generó */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                Generó
              </label>
              <input
                type="text"
                value={formData.genero}
                onChange={(e) => updateField('genero', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#f9fafb',
                  outline: 'none'
                }}
                readOnly
              />
            </div>
          </div>

          {/* Quinta fila: Servicios (select multiple) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: THEME_COLORS.text
            }}>
              Servicios/Descripción *
            </label>
            
            {loadingServicios ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: THEME_COLORS.textSecondary,
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}>
                Cargando servicios...
              </div>
            ) : (
              <select
                multiple
                value={formData.servicios.map(s => s.id)}
                onChange={(e) => {
                  const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                  const selectedServices = selectedIds.map(id => {
                    const servicio = servicios.find(s => s.id === id);
                    return servicio ? {
                      id: servicio.id,
                      titulo: servicio.titulo,
                      costo: servicio.costo
                    } : null;
                  }).filter(Boolean);
                  
                  updateField('servicios', selectedServices);
                }}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  border: `2px solid ${errors.servicios ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = THEME_COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = errors.servicios ? '#dc2626' : '#d1d5db'}
              >
                {servicios.length === 0 ? (
                  <option disabled>No hay servicios disponibles</option>
                ) : (
                  servicios.map(servicio => (
                    <option 
                      key={servicio.id} 
                      value={servicio.id}
                      style={{
                        padding: '8px 12px',
                        fontSize: '14px',
                        backgroundColor: formData.servicios.some(s => s.id === servicio.id) ? '#e0f2fe' : 'white'
                      }}
                    >
                      {servicio.titulo} — ${formatearNumero(servicio.costo)}
                    </option>
                  ))
                )}
              </select>
            )}
            
            {/* Servicios seleccionados - Vista previa */}
            {formData.servicios.length > 0 && (
              <div style={{
                marginTop: '8px',
                padding: '12px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '6px',
                fontSize: '12px'
              }}>
                <div style={{ fontWeight: '500', marginBottom: '4px', color: THEME_COLORS.text }}>
                  Servicios seleccionados ({formData.servicios.length}):
                </div>
                {formData.servicios.map((servicio, index) => (
                  <div key={servicio.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    color: THEME_COLORS.textSecondary,
                    marginBottom: index < formData.servicios.length - 1 ? '2px' : 0
                  }}>
                    <span>{servicio.titulo}</span>
                    <span>${formatearNumero(servicio.costo)}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ 
              fontSize: '12px', 
              color: THEME_COLORS.textSecondary, 
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              💡 Mantén presionado Ctrl (Windows) o Cmd (Mac) para seleccionar múltiples servicios
            </div>
            
            {errors.servicios && (
              <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                {errors.servicios}
              </p>
            )}
          </div>

          {/* Sexta fila: Técnicos (multi-select) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: THEME_COLORS.text
            }}>
              Técnicos *
            </label>
            
            {loadingTecnicos ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: THEME_COLORS.textSecondary
              }}>
                Cargando técnicos...
              </div>
            ) : (
              <div style={{
                border: `2px solid ${errors.tecnico ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '8px',
                maxHeight: '150px',
                overflowY: 'auto',
                backgroundColor: 'white'
              }}>
                {tecnicos.length === 0 ? (
                  <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: THEME_COLORS.textSecondary
                  }}>
                    No hay técnicos disponibles
                  </div>
                ) : (
                  tecnicos.map(tecnico => (
                    <label
                      key={tecnico.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f9fafb'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <input
                        type="checkbox"
                        checked={formData.tecnico.includes(tecnico.nombre)}
                        onChange={(e) => {
                          const newTecnicos = e.target.checked
                            ? [...formData.tecnico, tecnico.nombre]
                            : formData.tecnico.filter(nombre => nombre !== tecnico.nombre);
                          updateField('tecnico', newTecnicos);
                        }}
                        style={{
                          marginRight: '12px',
                          transform: 'scale(1.2)',
                          accentColor: THEME_COLORS.primary
                        }}
                      />
                      <span style={{
                        fontWeight: '500',
                        color: THEME_COLORS.text
                      }}>
                        {tecnico.nombre}
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
            
            {errors.tecnico && (
              <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                {errors.tecnico}
              </p>
            )}
          </div>

          {/* Séptima fila: Totales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            {/* Subtotal */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                Subtotal
              </label>
              <input
                type="text"
                value={`$${formatearNumero(formData.subtotal)}`}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: 'white',
                  color: THEME_COLORS.text,
                  textAlign: 'right'
                }}
                readOnly
              />
            </div>

            {/* Total */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: THEME_COLORS.text
              }}>
                Total (con IVA 19%)
              </label>
              <input
                type="text"
                value={`$${formatearNumero(formData.total)}`}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: 'white',
                  color: THEME_COLORS.primary,
                  textAlign: 'right'
                }}
                readOnly
              />
            </div>
          </div>

          {/* Botones */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: `2px solid ${THEME_COLORS.primary}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: 'white',
                color: THEME_COLORS.primary,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#f9fafb')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = 'white')}
            >
              Cancelar
            </button>
            
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: loading ? '#9ca3af' : THEME_COLORS.primary,
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = THEME_COLORS.primaryDark)}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = THEME_COLORS.primary)}
            >
              {loading && (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
              {loading ? 'Guardando...' : (initialData?.id ? 'Actualizar' : 'Crear Remisión')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default FormularioRemision;
