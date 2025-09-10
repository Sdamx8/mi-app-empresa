// hooks/useFormRemision.js - Hook para manejo de formulario de remisiones
import { useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { MESSAGES, DB_FIELDS } from '../constants';

export const useFormRemision = (initialData = null) => {
  const [formData, setFormData] = useState({
    remision: '',
    movil: '',
    estado: 'pendiente',
    descripcion: '',
    subtotal: '',
    autorizo: '',
    carroceria: '',
    no_orden: '',
    no_fact_elect: '',
    radicacion: '',
    genero: '',
    tecnico: '',
    une: '',
    total: '',
    fecha_remision: '',
    fecha_bit_prof: '',
    fecha_maximo: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validar campos requeridos
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
    
    // Validar descripción
    if (!formData.descripcion || !formData.descripcion.toString().trim()) {
      newErrors.descripcion = 'Descripción es obligatoria';
    }
    
    // Validar estado
    if (!formData.estado) {
      newErrors.estado = 'Estado es obligatorio';
    }

    // Validar subtotal
    if (formData.subtotal && isNaN(parseFloat(formData.subtotal))) {
      newErrors.subtotal = 'Subtotal debe ser un número válido';
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
      remision: '',
      movil: '',
      estado: 'pendiente',
      descripcion: '',
      subtotal: '',
      autorizo: '',
      carroceria: '',
      no_orden: '',
      no_fact_elect: '',
      radicacion: '',
      genero: '',
      tecnico: '',
      une: '',
      total: '',
      fecha_remision: '',
      fecha_bit_prof: '',
      fecha_maximo: ''
    });
    setErrors({});
  }, []);

  // Cargar datos iniciales para edición
  const loadFromData = useCallback((data) => {
    if (!data) return;
    setFormData(prev => ({
      ...prev,
      remision: data.remision || '',
      movil: data.movil || '',
      estado: data.estado || 'pendiente',
      descripcion: data.descripcion || '',
      subtotal: data.subtotal?.toString?.() || '',
      autorizo: data.autorizo || '',
      carroceria: data.carroceria || '',
      no_orden: data.no_orden || '',
      no_fact_elect: data.no_fact_elect || '',
      radicacion: data.radicacion || '',
      genero: data.genero || '',
      tecnico: data.tecnico || '',
      une: data.une || '',
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

  // Guardar remisión en Firestore
  const saveRemision = useCallback(async () => {
    if (!validateForm()) {
      return { success: false, error: MESSAGES.REQUIRED_FIELDS };
    }

    setLoading(true);
    
    try {
      // Preparar datos para Firestore con validación segura
      const parseFecha = (s) => {
        if (!s) return null;
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
      };

      const dataToSave = {
        [DB_FIELDS.REMISION]: formData.remision ? formData.remision.toString().trim() : '',
        [DB_FIELDS.MOVIL]: formData.movil ? formData.movil.toString().trim() : '',
        [DB_FIELDS.ESTADO]: formData.estado,
        [DB_FIELDS.DESCRIPCION]: formData.descripcion ? formData.descripcion.toString().trim() : '',
        [DB_FIELDS.FECHA_ID_BIT]: Date.now(),
        updated_at: serverTimestamp()
      };

      // Fechas
      const fr = parseFecha(formData.fecha_remision);
      const fb = parseFecha(formData.fecha_bit_prof);
      const fm = parseFecha(formData.fecha_maximo);
      if (fr) dataToSave[DB_FIELDS.FECHA_REMISION] = fr; else if (!initialData?.id) dataToSave[DB_FIELDS.FECHA_REMISION] = serverTimestamp();
      if (fb) dataToSave[DB_FIELDS.FECHA_BIT_PROF] = fb;
      if (fm) dataToSave[DB_FIELDS.FECHA_MAXIMO] = fm;

      // Números
      if (formData.subtotal && !isNaN(parseFloat(formData.subtotal))) {
        dataToSave[DB_FIELDS.SUBTOTAL] = parseFloat(formData.subtotal);
      }
      if (formData.total && !isNaN(parseFloat(formData.total))) {
        dataToSave[DB_FIELDS.TOTAL] = parseFloat(formData.total);
      }

      // Campos de texto opcionales
      if (formData.autorizo && formData.autorizo.toString().trim()) {
        dataToSave[DB_FIELDS.AUTORIZO] = formData.autorizo.toString().trim();
      }
      if (formData.carroceria && formData.carroceria.toString().trim()) {
        dataToSave[DB_FIELDS.CARROCERIA] = formData.carroceria.toString().trim();
      }
      if (formData.no_orden && formData.no_orden.toString().trim()) {
        dataToSave[DB_FIELDS.NO_ORDEN] = formData.no_orden.toString().trim();
      }
      if (formData.no_fact_elect && formData.no_fact_elect.toString().trim()) {
        dataToSave[DB_FIELDS.NO_FACT_ELECT] = formData.no_fact_elect.toString().trim();
      }
      if (formData.radicacion && formData.radicacion.toString().trim()) {
        dataToSave[DB_FIELDS.RADICACION] = formData.radicacion.toString().trim();
      }
      if (formData.genero && formData.genero.toString().trim()) {
        dataToSave[DB_FIELDS.GENERO] = formData.genero.toString().trim();
      }
      if (formData.tecnico && formData.tecnico.toString().trim()) {
        dataToSave[DB_FIELDS.TECNICO] = formData.tecnico.toString().trim();
      }
      if (formData.une && formData.une.toString().trim()) {
        dataToSave[DB_FIELDS.UNE] = formData.une.toString().trim();
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
        numeroRemision: formData.remision.toString().trim() // Incluir número de remisión para integración
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
