import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  collection,
  addDoc,
  setDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { MESSAGES, DB_FIELDS } from '../constants';

export const useFormRemision = (initialData = null) => {
  const { user } = useAuth();

  const emptyForm = {
    remision: '',
    movil: '',
    no_orden: '',
    estado: 'RADICADO',
    descripcion: [], // array de ids de servicio
    fecha_remision: '',
    fecha_maximo: '',
    fecha_bit_prof: '',
    radicacion: '',
    no_id_bit: '',
    no_fact_elect: '',
    subtotal: '',
    total: '',
    une: 'SANJOSE1',
    carroceria: '',
    autorizo: '',
    tecnico: [], // array de ids de tecnico
    genero: '' // actualmente guarda nombre del empleado (considera renombrar)
  };

  const [formData, setFormData] = useState(() => ({ ...emptyForm }));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // listas desplegables
  const [servicios, setServicios] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);

  // --- UTILIDADES DE FECHAS ---
  const parsePossibleDate = (v) => {
    if (!v && v !== 0) return null;
    try {
      // Si viene como timestamp Firestore (has toDate)
      if (typeof v === 'object' && typeof v.toDate === 'function') return v.toDate();

      // Si ya es Date
      if (v instanceof Date) return v;

      // Si es string en YYYY-MM-DD (input type=date)
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        return new Date(`${v}T00:00:00`);
      }

      // Si es string en DD/MM/YYYY
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) {
        const [dd, mm, yyyy] = v.split('/');
        return new Date(`${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}T00:00:00`);
      }

      // Intentar parse automático
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d;
    } catch (e) {
      // fallthrough
    }
    return null;
  };

  const formatDateToInput = (v) => {
    const d = parsePossibleDate(v);
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`; // formato compatible con <input type="date">
  };

  const formatDateToDDMMYYYY = (v) => {
    const d = parsePossibleDate(v);
    if (!d) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // --- MAPS PARA BÚSQUEDAS RÁPIDAS (optimización) ---
  const serviciosMap = useMemo(() => {
    const m = new Map();
    servicios.forEach(s => m.set(s.id, s));
    return m;
  }, [servicios]);

  const tecnicosMap = useMemo(() => {
    const m = new Map();
    tecnicos.forEach(t => m.set(t.id, t));
    return m;
  }, [tecnicos]);

  // --- CARGAR EMPLEADO ACTUAL ---
  const cargarEmpleadoActual = useCallback(async () => {
    if (!user?.email) {
      console.log('❌ cargarEmpleadoActual: No hay email de usuario disponible');
      return;
    }

    const userEmail = user.email.trim().toLowerCase();
    console.log('🔍 cargarEmpleadoActual: Buscando empleado con email:', userEmail);

    try {
      // Intento 1: Búsqueda directa por contacto.correo
      let q = query(
        collection(db, 'EMPLEADOS'),
        where('contacto.correo', '==', user.email)
      );
      
      let snap = await getDocs(q);
      console.log('📊 Búsqueda directa - documentos encontrados:', snap.size);

      // Si no encuentra resultados, intentar fallback con scan completo
      if (snap.empty) {
        console.log('🔄 Búsqueda directa falló, iniciando fallback con scan completo...');
        
        // Obtener todos los empleados para comparación case-insensitive
        const allEmpleadosQuery = query(collection(db, 'EMPLEADOS'));
        const allSnap = await getDocs(allEmpleadosQuery);
        console.log('📊 Total empleados en colección:', allSnap.size);

        // Buscar manualmente con comparación case-insensitive
        let foundDoc = null;
        allSnap.forEach((doc) => {
          const data = doc.data();
          const dbEmail = data.contacto?.correo;
          
          if (dbEmail && dbEmail.trim().toLowerCase() === userEmail) {
            foundDoc = { id: doc.id, data };
            console.log('✅ Empleado encontrado en fallback:', {
              id: doc.id,
              nombre_completo: data.nombre_completo,
              email_db: dbEmail,
              email_user: user.email
            });
          }
        });

        if (foundDoc && foundDoc.data.nombre_completo) {
          setFormData(prev => ({ 
            ...prev, 
            genero: foundDoc.data.nombre_completo 
          }));
          console.log('✅ Campo genero actualizado con:', foundDoc.data.nombre_completo);
          return;
        }

        console.log('❌ No se encontró empleado con email:', userEmail);
        console.log('💡 Emails disponibles en EMPLEADOS:');
        allSnap.forEach((doc) => {
          const data = doc.data();
          console.log('📧', {
            id: doc.id,
            nombre: data.nombre_completo,
            email: data.contacto?.correo
          });
        });
        return;
      }

      // Procesar resultado de búsqueda directa
      const data = snap.docs[0].data();
      console.log('👤 Empleado encontrado:', {
        id: snap.docs[0].id,
        nombre_completo: data.nombre_completo,
        email: data.contacto?.correo,
        tipo_empleado: data.tipo_empleado
      });

      if (data.nombre_completo) {
        setFormData(prev => ({ 
          ...prev, 
          genero: data.nombre_completo 
        }));
        console.log('✅ Campo genero actualizado con:', data.nombre_completo);
      } else {
        console.log('⚠️ Empleado encontrado pero sin nombre_completo');
      }

    } catch (error) {
      console.error('❌ Error cargando empleado actual:', error);
      
      // Manejar errores específicos de Firestore
      if (error.code === 'permission-denied') {
        console.error('🚫 Error de permisos: Verifique las reglas de Firestore para la colección EMPLEADOS');
      } else if (error.code === 'failed-precondition') {
        console.error('📋 Error de índice: Es posible que necesite crear un índice compuesto en Firebase Console');
      } else {
        console.error('🔥 Error desconocido:', error.message);
      }
    }
  }, [user?.email]);

  // --- CARGAR SERVICIOS ---
  const cargarServicios = useCallback(async () => {
    setLoadingServicios(true);
    try {
      const q = query(collection(db, 'servicios'), orderBy('titulo'));
      const snap = await getDocs(q);
      const arr = [];
      snap.forEach(d => {
        const data = d.data();
        arr.push({
          id: d.id,
          titulo: data.titulo || '',
          subtotal: data.costo ?? data.subtotal ?? 0
        });
      });
      setServicios(arr);
    } catch (error) {
      console.error('Error cargando servicios:', error);
      setServicios([]);
    } finally {
      setLoadingServicios(false);
    }
  }, []);

  // --- CARGAR TECNICOS ---
  const cargarTecnicos = useCallback(async () => {
    console.log('🔧 cargarTecnicos: Iniciando carga de técnicos...');
    setLoadingTecnicos(true);
    
    try {
      // Intento 1: Consulta directa con filtro tipo_empleado
      console.log('🔍 Intentando consulta directa: tipo_empleado == "tecnico"');
      
      let q = query(
        collection(db, 'EMPLEADOS'), 
        where('tipo_empleado', '==', 'tecnico'),
        orderBy('nombre_completo')
      );
      
      let snap = await getDocs(q);
      console.log('📊 Consulta directa - técnicos encontrados:', snap.size);

      const arr = [];
      snap.forEach(d => {
        const data = d.data();
        console.log('👷 Técnico encontrado:', {
          id: d.id,
          nombre_completo: data.nombre_completo,
          tipo_empleado: data.tipo_empleado,
          cargo: data.cargo
        });
        
        if (data.nombre_completo) {
          arr.push({ 
            id: d.id, 
            nombre: data.nombre_completo 
          });
        }
      });

      // Si la consulta directa no dio resultados, hacer fallback
      if (arr.length === 0) {
        console.log('🔄 Consulta directa sin resultados, iniciando fallback...');
        
        try {
          // Fallback: obtener todos los empleados y filtrar manualmente
          const q2 = query(collection(db, 'EMPLEADOS'), orderBy('nombre_completo'));
          const snap2 = await getDocs(q2);
          console.log('📊 Fallback - total empleados para filtrar:', snap2.size);

          snap2.forEach(d => {
            const data = d.data();
            const tipo = (data.tipo_empleado || '').toString().toLowerCase();
            const cargo = (data.cargo || '').toString().toLowerCase();
            
            // Filtro: tipo_empleado o cargo que contenga 'tecnico'
            const esTecnico = tipo === 'tecnico' || cargo.includes('tecnico');
            
            console.log('🔍 Evaluando empleado:', {
              id: d.id,
              nombre: data.nombre_completo,
              tipo_empleado: data.tipo_empleado,
              cargo: data.cargo,
              esTecnico
            });

            if (data.nombre_completo && esTecnico) {
              arr.push({ 
                id: d.id, 
                nombre: data.nombre_completo 
              });
              console.log('✅ Técnico agregado al fallback:', data.nombre_completo);
            }
          });
        } catch (fallbackError) {
          console.error('❌ Error en fallback de técnicos:', fallbackError);
        }
      }

      console.log('📋 Lista final de técnicos:', arr.map(t => `${t.id}: ${t.nombre}`));
      console.log('✅ Total técnicos cargados:', arr.length);
      
      setTecnicos(arr);

      // Advertencias útiles
      if (arr.length === 0) {
        console.warn('⚠️ No se encontraron técnicos. Verifique:');
        console.warn('   1. Que existan empleados con tipo_empleado="tecnico"');
        console.warn('   2. Que los nombres de campos sean exactos (case-sensitive)');
        console.warn('   3. Permisos de lectura en la colección EMPLEADOS');
      }

    } catch (error) {
      console.error('❌ Error cargando técnicos:', error);
      
      // Manejar errores específicos
      if (error.code === 'failed-precondition') {
        console.error('📋 ERROR DE ÍNDICE: Necesita crear un índice compuesto en Firebase Console:');
        console.error('   Colección: EMPLEADOS');
        console.error('   Campos: tipo_empleado (Ascending), nombre_completo (Ascending)');
        console.error('   🔗 Vaya a: Firebase Console > Firestore > Indexes > Create Index');
      } else if (error.code === 'permission-denied') {
        console.error('🚫 Error de permisos: Verifique las reglas de Firestore para EMPLEADOS');
      } else {
        console.error('🔥 Error desconocido:', error.message);
      }
      
      setTecnicos([]);
    } finally {
      setLoadingTecnicos(false);
      console.log('🏁 cargarTecnicos: Proceso finalizado');
    }
  }, []);

  // Cargar listas y empleado al montar
  useEffect(() => {
    cargarServicios();
    cargarTecnicos();
    cargarEmpleadoActual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- VALIDACIONES ---
  const validateForm = useCallback(() => {
    const newErrors = {};

    // remision
    if (!formData.remision || !formData.remision.toString().trim()) {
      newErrors.remision = 'Número de remisión es obligatorio';
    } else if (formData.remision.toString().trim().length < 3) {
      newErrors.remision = 'Número de remisión debe tener al menos 3 caracteres';
    }

    // movil
    if (!formData.movil || !formData.movil.toString().trim()) {
      newErrors.movil = 'Móvil es obligatorio';
    } else if (!/^[A-Za-z0-9\-_]+$/.test(formData.movil.toString().trim())) {
      newErrors.movil = 'Móvil debe contener solo letras, números, guiones o guiones bajos';
    }

    // descripcion => array de ids
    if (!Array.isArray(formData.descripcion) || formData.descripcion.length === 0) {
      newErrors.descripcion = 'Debe seleccionar al menos un servicio';
    }

    // tecnico => array de ids
    if (!Array.isArray(formData.tecnico) || formData.tecnico.length === 0) {
      newErrors.tecnico = 'Debe seleccionar al menos un técnico';
    }

    if (!formData.autorizo || !formData.autorizo.toString().trim()) {
      newErrors.autorizo = 'Campo Autorizó es obligatorio';
    }

    // fecha_remision
    if (!formData.fecha_remision) {
      newErrors.fecha_remision = 'Fecha de remisión es obligatoria';
    } else if (!parsePossibleDate(formData.fecha_remision)) {
      newErrors.fecha_remision = 'Formato de fecha inválido';
    }

    // numeric validations
    if (formData.subtotal) {
      const subtotal = parseFloat(formData.subtotal);
      if (isNaN(subtotal) || subtotal < 0) {
        newErrors.subtotal = 'Subtotal debe ser un número positivo';
      }
    }

    if (formData.total) {
      const total = parseFloat(formData.total);
      if (isNaN(total) || total < 0) {
        newErrors.total = 'Total debe ser un número positivo';
      }
    }

    if (formData.subtotal && formData.total) {
      const subtotal = parseFloat(formData.subtotal);
      const total = parseFloat(formData.total);
      if (!isNaN(subtotal) && !isNaN(total) && total < subtotal) {
        newErrors.total = 'El total no puede ser menor que el subtotal';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // --- ACTUALIZAR CAMPO ---
  const updateField = useCallback((field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Si actualizamos descripcion (array de ids) recalcular subtotal/total
      if (field === 'descripcion') {
        const ids = Array.isArray(value) ? value : [];
        let subtotalTotal = 0;
        for (const id of ids) {
          const s = serviciosMap.get(id);
          subtotalTotal += parseFloat(s?.subtotal || 0) || 0;
        }
        newData.subtotal = subtotalTotal ? Math.round(subtotalTotal).toString() : '';
        newData.total = subtotalTotal ? Math.round(subtotalTotal * 1.19).toString() : '';
        newData.descripcion = ids;
      }

      // técnico (array)
      if (field === 'tecnico') {
        newData.tecnico = Array.isArray(value) ? value : [];
      }

      // si cambian subtotal manualmente, recalcula total
      if (field === 'subtotal') {
        const subtotalNum = parseFloat(value) || 0;
        newData.total = subtotalNum ? Math.round(subtotalNum * 1.19).toString() : '';
        newData.subtotal = value?.toString?.() ?? '';
      }

      return newData;
    });

    // limpiar error del campo
    setErrors(prev => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, [serviciosMap]);

  // --- RESET ---
  const resetForm = useCallback(() => {
    setFormData({ ...emptyForm });
    setErrors({});
    cargarEmpleadoActual();
  }, [cargarEmpleadoActual]);

  // --- CARGAR DATOS PARA EDICIÓN ---
  const loadFromData = useCallback((data) => {
    if (!data) return;
    setFormData(prev => ({
      ...prev,
      remision: data.remision || '',
      movil: data.movil || '',
      estado: data.estado || 'RADICADO',
      // si en la BD tienes nombres almacenados, asumimos que también guardaste el array 'descripcion_ids'
      descripcion: Array.isArray(data.descripcion_ids) ? data.descripcion_ids : (Array.isArray(data.descripcion) ? data.descripcion : []),
      subtotal: data.subtotal?.toString?.() || '',
      autorizo: data.autorizo || '',
      carroceria: data.carroceria || '',
      no_orden: data.no_orden || '',
      no_fact_elect: data.no_fact_elect || '',
      radicacion: data.radicacion || '',
      genero: data.genero || '',
      tecnico: Array.isArray(data.tecnico_ids) ? data.tecnico_ids : (Array.isArray(data.tecnico) ? data.tecnico : []),
      une: data.une || '',
      total: data.total?.toString?.() || '',
      fecha_remision: formatDateToInput(data.fecha_remision || data.fecha_remision_str),
      fecha_bit_prof: formatDateToInput(data.fecha_bit_prof || data.fecha_bit_prof_str),
      fecha_maximo: formatDateToInput(data.fecha_maximo || data.fecha_maximo_str)
    }));
  }, []);

  // --- GUARDAR en Firestore ---
  const saveRemision = useCallback(async () => {
    if (!validateForm()) {
      return { success: false, error: MESSAGES.REQUIRED_FIELDS };
    }

    setLoading(true);
    try {
      // preparar arrays: ids (para integridad) y nombres (para visualización)
      const descripcion_ids = Array.isArray(formData.descripcion) ? formData.descripcion : [];
      const descripcion_titles = descripcion_ids.map(id => serviciosMap.get(id)?.titulo || '').filter(Boolean);

      const tecnico_ids = Array.isArray(formData.tecnico) ? formData.tecnico : [];
      const tecnico_names = tecnico_ids.map(id => tecnicosMap.get(id)?.nombre || '').filter(Boolean);

      const fecha_remision_date = parsePossibleDate(formData.fecha_remision);
      const fecha_maximo_date = parsePossibleDate(formData.fecha_maximo);
      const fecha_bit_prof_date = parsePossibleDate(formData.fecha_bit_prof);
      const radicacion_date = parsePossibleDate(formData.radicacion);

      const formatNumber = (value) => {
        if (value === undefined || value === null || value === '') return '';
        const num = parseFloat(value);
        if (isNaN(num)) return '';
        return Math.round(num).toString();
      };

      const dataToSave = {
        remision: formData.remision ? formData.remision.toString().trim() : '',
        movil: formData.movil ? formData.movil.toString().trim() : '',
        no_orden: formData.no_orden ? formData.no_orden.toString().trim() : '',
        estado: formData.estado || 'RADICADO',

        // mantengo both: ids para lógica y título concatenado para lectura humana
        descripcion_ids,
        descripcion_titles: descripcion_titles.join(', '),
        descripcion_display: descripcion_titles.join(', '),

        fecha_remision_str: formatDateToDDMMYYYY(fecha_remision_date),
        fecha_remision_ts: fecha_remision_date ? Timestamp.fromDate(fecha_remision_date) : null,

        fecha_maximo_str: formatDateToDDMMYYYY(fecha_maximo_date),
        fecha_maximo_ts: fecha_maximo_date ? Timestamp.fromDate(fecha_maximo_date) : null,

        fecha_bit_prof_str: formatDateToDDMMYYYY(fecha_bit_prof_date),
        fecha_bit_prof_ts: fecha_bit_prof_date ? Timestamp.fromDate(fecha_bit_prof_date) : null,

        radicacion_str: formatDateToDDMMYYYY(radicacion_date),
        radicacion_ts: radicacion_date ? Timestamp.fromDate(radicacion_date) : null,

        no_id_bit: formData.no_id_bit ? formData.no_id_bit.toString().trim() : '',
        no_fact_elect: formData.no_fact_elect ? formData.no_fact_elect.toString().trim() : '',
        autorizo: formData.autorizo ? formData.autorizo.toString().trim() : '',
        genero: formData.genero ? formData.genero.toString().trim() : '',

        subtotal: formatNumber(formData.subtotal),
        total: formatNumber(formData.total),

        une: formData.une || 'SANJOSE1',
        carroceria: formData.carroceria ? formData.carroceria.toString().trim() : '',

        tecnico_ids,
        tecnico_names: tecnico_names.join(' - '),

        updated_at: serverTimestamp()
      };

      // Guardar usando remisión como ID si el usuario lo desea (preservar consistencia)
      const remisionId = formData.remision ? formData.remision.toString().trim() : null;

      if (initialData?.id && initialData.id !== remisionId && remisionId) {
        // caso: estamos editando y se cambió el número de remisión -> crear nuevo doc con el nuevo ID y opcionalmente eliminar el anterior
        // Aquí usamos setDoc con doc id = remisionId
        await setDoc(doc(db, 'remisiones', remisionId), {
          ...dataToSave,
          created_at: serverTimestamp()
        });
        // actualizar el viejo con un flag (opcional) o eliminar si así lo prefieres:
        // await deleteDoc(doc(db, 'remisiones', initialData.id));
      } else if (initialData?.id) {
        // actualizar el doc existente (merge)
        await updateDoc(doc(db, 'remisiones', initialData.id), dataToSave);
      } else if (remisionId) {
        // crear documento con ID específico (remision)
        await setDoc(doc(db, 'remisiones', remisionId), {
          ...dataToSave,
          created_at: serverTimestamp()
        });
      } else {
        // fallback: crear con ID auto generado
        const added = await addDoc(collection(db, 'remisiones'), {
          ...dataToSave,
          created_at: serverTimestamp()
        });
        // si quieres, puedes devolver el id autogenerado
        return {
          success: true,
          id: added.id,
          message: MESSAGES.SAVE_SUCCESS,
          numeroRemision: null
        };
      }

      return {
        success: true,
        id: remisionId || initialData?.id || null,
        message: initialData?.id ? 'Remisión actualizada exitosamente' : MESSAGES.SAVE_SUCCESS,
        numeroRemision: remisionId || ''
      };
    } catch (error) {
      console.error('Error guardando remisión:', error);
      return {
        success: false,
        error: `${MESSAGES.SAVE_ERROR} ${error?.message ?? error}`
      };
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, initialData, serviciosMap, tecnicosMap]);

  return {
    formData,
    loading,
    errors,
    servicios,
    tecnicos,
    loadingServicios,
    loadingTecnicos,
    cargarServicios,
    cargarTecnicos,
    updateField,
    resetForm,
    loadFromData,
    saveRemision,
    validateForm
  };
};

export default useFormRemision;
// hooks/useFormRemision.js - Hook para manejo de formulario de remisiones
