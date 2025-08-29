// hooks/useFormRemision.js - Hook para manejo de formulario de remisiones
import { useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { MESSAGES, DB_FIELDS } from '../constants';

export const useFormRemision = () => {
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
    genero: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validar campos requeridos
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.remision.trim()) {
      newErrors.remision = 'Número de remisión es obligatorio';
    }
    
    if (!formData.movil.trim()) {
      newErrors.movil = 'Móvil es obligatorio';
    }
    
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'Descripción es obligatoria';
    }
    
    if (!formData.estado) {
      newErrors.estado = 'Estado es obligatorio';
    }

    if (formData.subtotal && isNaN(parseFloat(formData.subtotal))) {
      newErrors.subtotal = 'Subtotal debe ser un número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Actualizar campo del formulario
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
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
      genero: ''
    });
    setErrors({});
  }, []);

  // Guardar remisión en Firestore
  const saveRemision = useCallback(async () => {
    if (!validateForm()) {
      return { success: false, error: MESSAGES.REQUIRED_FIELDS };
    }

    setLoading(true);
    
    try {
      // Preparar datos para Firestore
      const dataToSave = {
        [DB_FIELDS.REMISION]: formData.remision.trim(),
        [DB_FIELDS.MOVIL]: formData.movil.trim(),
        [DB_FIELDS.ESTADO]: formData.estado,
        [DB_FIELDS.DESCRIPCION]: formData.descripcion.trim(),
        [DB_FIELDS.FECHA_REMISION]: serverTimestamp(),
        [DB_FIELDS.FECHA_ID_BIT]: Date.now(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      // Agregar campos opcionales si tienen valor
      if (formData.subtotal && !isNaN(parseFloat(formData.subtotal))) {
        dataToSave[DB_FIELDS.SUBTOTAL] = parseFloat(formData.subtotal);
      }
      
      if (formData.autorizo.trim()) {
        dataToSave[DB_FIELDS.AUTORIZO] = formData.autorizo.trim();
      }
      
      if (formData.carroceria.trim()) {
        dataToSave[DB_FIELDS.CARROCERIA] = formData.carroceria.trim();
      }
      
      if (formData.no_orden.trim()) {
        dataToSave[DB_FIELDS.NO_ORDEN] = formData.no_orden.trim();
      }
      
      if (formData.no_fact_elect.trim()) {
        dataToSave[DB_FIELDS.NO_FACT_ELECT] = formData.no_fact_elect.trim();
      }
      
      if (formData.radicacion.trim()) {
        dataToSave[DB_FIELDS.RADICACION] = formData.radicacion.trim();
      }
      
      if (formData.genero.trim()) {
        dataToSave[DB_FIELDS.GENERO] = formData.genero.trim();
      }

      // Guardar en Firestore
      const docRef = await addDoc(collection(db, 'remisiones'), dataToSave);
      
      console.log('Documento guardado con ID:', docRef.id);
      
      return { 
        success: true, 
        id: docRef.id,
        message: MESSAGES.SAVE_SUCCESS 
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
  }, [formData, validateForm]);

  return {
    formData,
    loading,
    errors,
    updateField,
    resetForm,
    saveRemision,
    validateForm
  };
};

export default useFormRemision;
