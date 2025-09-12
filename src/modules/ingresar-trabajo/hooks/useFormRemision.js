// hooks/useFormRemision.js - Hook para manejo de formulario de remisiones
import { useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../core/config/firebaseConfig';
import { MESSAGES, DB_FIELDS } from '../../../shared/constants';

export const useFormRemision = (initialData = null) => {
  const [formData, setFormData] = useState({
    // Campos básicos
    remision: '',
    movil: '',
    estado: 'PENDIENTE', // Estados según Firestore: PENDIENTE, EN_PROCESO, COMPLETADO, RADICADO
    
    // Información del trabajo
    autorizo: '',
    carroceria: '',
    no_orden: '',
    no_fact_elect: '',
    no_id_bit: '', // Nuevo campo según estructura Firestore
    radicacion: '',
    genero: '',
    une: '',
    
    // Servicios (hasta 5 según estructura Firestore)
    servicio1: '',
    servicio2: '',
    servicio3: '',
    servicio4: '',
    servicio5: '',
    
    // Técnicos (hasta 3 según estructura Firestore)
    tecnico1: '',
    tecnico2: '',
    tecnico3: '',
    
    // Costos
    subtotal: '',
    total: '',
    
    // Fechas
    fecha_remision: '',
    fecha_bit_prof: '',
    fecha_maximo: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validar campos requeridos según estructura Firestore
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // Validar remisión
    if (!formData.remision || !formData.remision.toString().trim()) {
      newErrors.remision = 'Número de remisión es obligatorio';
    }
    
    // Validar móvil
    if (!formData.movil || !formData.movil.toString().trim()) {
      newErrors.movil = 'Móvil es obligatorio';
    }
    
    // Validar al menos un servicio
    if (!formData.servicio1 || !formData.servicio1.trim()) {
      newErrors.servicio1 = 'Al menos el primer servicio es obligatorio';
    }
    
    // Validar al menos un técnico
    if (!formData.tecnico1 || !formData.tecnico1.trim()) {
      newErrors.tecnico1 = 'Al menos el primer técnico es obligatorio';
    }
    
    // Validar estado
    if (!formData.estado) {
      newErrors.estado = 'Estado es obligatorio';
    }

    // Validar subtotal
    if (formData.subtotal && isNaN(parseFloat(formData.subtotal))) {
      newErrors.subtotal = 'Subtotal debe ser un número válido';
    }

    // Validar no_id_bit si se proporciona
    if (formData.no_id_bit && isNaN(parseInt(formData.no_id_bit))) {
      newErrors.no_id_bit = 'No. ID BIT debe ser un número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Actualizar campo del formulario
  const updateField = useCallback((field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Calcular total automáticamente cuando se actualiza el subtotal
      if (field === 'subtotal' && value) {
        const subtotalNum = parseFloat(value);
        if (!isNaN(subtotalNum)) {
          const iva = subtotalNum * 0.19; // 19% IVA
          const totalCalculado = subtotalNum + iva;
          newData.total = totalCalculado.toFixed(2);
        }
      }
      
      return newData;
    });
    
    // Limpiar error del campo cuando se actualiza
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [errors]);

  // Limpiar formulario
  const resetForm = useCallback(() => {
    setFormData({
      // Campos básicos
      remision: '',
      movil: '',
      estado: 'PENDIENTE',
      
      // Información del trabajo
      autorizo: '',
      carroceria: '',
      no_orden: '',
      no_fact_elect: '',
      no_id_bit: '',
      radicacion: '',
      genero: '',
      une: '',
      
      // Servicios
      servicio1: '',
      servicio2: '',
      servicio3: '',
      servicio4: '',
      servicio5: '',
      
      // Técnicos
      tecnico1: '',
      tecnico2: '',
      tecnico3: '',
      
      // Costos
      subtotal: '',
      total: '',
      
      // Fechas
      fecha_remision: '',
      fecha_bit_prof: '',
      fecha_maximo: ''
    });
    setErrors({});
  }, []);

  // Cargar datos iniciales para edición según estructura Firestore
  const loadFromData = useCallback((data) => {
    if (!data) return;
    setFormData(prev => ({
      ...prev,
      // Campos básicos
      remision: data.remision || '',
      movil: data.movil?.toString?.() || '',
      estado: data.estado || 'PENDIENTE',
      
      // Información del trabajo
      autorizo: data.autorizo || '',
      carroceria: data.carroceria || '',
      no_orden: data.no_orden || '',
      no_fact_elect: data.no_fact_elect || '',
      no_id_bit: data.no_id_bit?.toString?.() || '',
      radicacion: data.radicacion || '',
      genero: data.genero || '',
      une: data.une || '',
      
      // Servicios
      servicio1: data.servicio1 || '',
      servicio2: data.servicio2 || '',
      servicio3: data.servicio3 || '',
      servicio4: data.servicio4 || '',
      servicio5: data.servicio5 || '',
      
      // Técnicos
      tecnico1: data.tecnico1 || '',
      tecnico2: data.tecnico2 || '',
      tecnico3: data.tecnico3 || '',
      
      // Costos
      subtotal: data.subtotal?.toString?.() || '',
      total: data.total?.toString?.() || '',
      
      // Fechas: mostrar en formato YYYY-MM-DD si vienen como Date/Timestamp/String
      fecha_remision: normalizarFechaInput(data.fecha_remision),
      fecha_bit_prof: normalizarFechaInput(data.fecha_bit_prof),
      fecha_maximo: normalizarFechaInput(data.fecha_maximo)
    }));
  }, []);

  const normalizarFechaInput = (v) => {
    try {
      let d = null;
      if (!v) return '';
      if (typeof v === 'string') d = new Date(v);
      else if (v?.toDate) d = v.toDate();
      else if (v instanceof Date) d = v;
      if (!d || isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch { return ''; }
  };

  // Guardar remisión en Firestore con estructura correcta
  const saveRemision = useCallback(async () => {
    if (!validateForm()) {
      return { success: false, error: MESSAGES.REQUIRED_FIELDS };
    }

    setLoading(true);
    
    try {
      // Preparar datos para Firestore según estructura real
      const parseFecha = (s) => {
        if (!s) return null;
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
      };

      const dataToSave = {
        // Campos básicos obligatorios
        remision: formData.remision ? formData.remision.toString().trim() : '',
        movil: formData.movil ? parseInt(formData.movil) : null,
        estado: formData.estado || 'PENDIENTE',
        
        // Timestamp de actualización
        updated_at: serverTimestamp()
      };

      // Información del trabajo (campos opcionales)
      if (formData.autorizo?.trim()) dataToSave.autorizo = formData.autorizo.trim();
      if (formData.carroceria?.trim()) dataToSave.carroceria = formData.carroceria.trim();
      if (formData.no_orden?.trim()) dataToSave.no_orden = formData.no_orden.trim();
      if (formData.no_fact_elect?.trim()) dataToSave.no_fact_elect = formData.no_fact_elect.trim();
      if (formData.no_id_bit?.trim()) dataToSave.no_id_bit = parseInt(formData.no_id_bit) || null;
      if (formData.radicacion?.trim()) dataToSave.radicacion = parseFecha(formData.radicacion);
      if (formData.genero?.trim()) dataToSave.genero = formData.genero.trim();
      if (formData.une?.trim()) dataToSave.une = formData.une.trim();
      
      // Servicios (solo agregar si tienen contenido)
      if (formData.servicio1?.trim()) dataToSave.servicio1 = formData.servicio1.trim();
      if (formData.servicio2?.trim()) dataToSave.servicio2 = formData.servicio2.trim();
      if (formData.servicio3?.trim()) dataToSave.servicio3 = formData.servicio3.trim();
      if (formData.servicio4?.trim()) dataToSave.servicio4 = formData.servicio4.trim();
      if (formData.servicio5?.trim()) dataToSave.servicio5 = formData.servicio5.trim();
      
      // Técnicos (solo agregar si tienen contenido)
      if (formData.tecnico1?.trim()) dataToSave.tecnico1 = formData.tecnico1.trim();
      if (formData.tecnico2?.trim()) dataToSave.tecnico2 = formData.tecnico2.trim();
      if (formData.tecnico3?.trim()) dataToSave.tecnico3 = formData.tecnico3.trim();

      // Fechas
      const fr = parseFecha(formData.fecha_remision);
      const fb = parseFecha(formData.fecha_bit_prof);
      const fm = parseFecha(formData.fecha_maximo);
      
      if (fr) dataToSave.fecha_remision = fr;
      else if (!initialData?.id) dataToSave.fecha_remision = serverTimestamp(); // Fecha actual si es nueva
      
      if (fb) dataToSave.fecha_bit_prof = fb;
      if (fm) dataToSave.fecha_maximo = fm;

      // Números (subtotal y total)
      if (formData.subtotal && !isNaN(parseFloat(formData.subtotal))) {
        dataToSave.subtotal = parseFloat(formData.subtotal);
      }
      if (formData.total && !isNaN(parseFloat(formData.total))) {
        dataToSave.total = parseFloat(formData.total);
      }

      // Usar el número de remisión como ID del documento
      const remisionId = formData.remision.toString().trim();
      let savedId = remisionId;
      
      if (initialData?.id) {
        // Si estamos editando y el ID cambió, eliminar el documento anterior y crear uno nuevo
        if (initialData.id !== remisionId) {
          // Eliminar documento antiguo
          await deleteDoc(doc(db, 'remisiones', initialData.id));
          // Crear nuevo documento con el nuevo ID
          dataToSave.created_at = serverTimestamp();
          await setDoc(doc(db, 'remisiones', remisionId), dataToSave);
        } else {
          // Actualizar documento existente
          await updateDoc(doc(db, 'remisiones', remisionId), dataToSave);
        }
      } else {
        // Crear nuevo documento usando el número de remisión como ID
        dataToSave.created_at = serverTimestamp();
        await setDoc(doc(db, 'remisiones', remisionId), dataToSave);
      }

      return { 
        success: true, 
        id: savedId,
        message: initialData?.id ? 'Remisión actualizada exitosamente' : MESSAGES.SAVE_SUCCESS,
        numeroRemision: formData.remision.toString().trim()
      };

    } catch (error) {
      console.error('Error guardando remisión:', error);
      return { 
        success: false, 
        error: `${MESSAGES.SAVE_ERROR}${error.message}` 
      };
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, initialData]);

  return {
    formData,
    loading,
    errors,
    updateField,
    resetForm,
    loadFromData,
    saveRemision,
    validateForm
  };
};

export default useFormRemision;
