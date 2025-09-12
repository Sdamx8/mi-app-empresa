import { useState, useCallback, useEffect } from 'react';
import type { RemisionFormData, EquipoUtilizado, MaterialUtilizado } from '../types';
import { DEFAULT_REMISION_DATA, VALIDATION_RULES } from '../constants';
import { remisionesService } from '../services/remisionesService';

interface UseRemisionFormProps {
  initialData?: Partial<RemisionFormData>;
  onSubmit: (data: RemisionFormData) => Promise<void>;
}

interface UseRemisionFormReturn {
  formData: RemisionFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  updateField: (field: keyof RemisionFormData, value: any) => void;
  addEquipo: (equipo: EquipoUtilizado) => void;
  removeEquipo: (index: number) => void;
  updateEquipo: (index: number, equipo: EquipoUtilizado) => void;
  addMaterial: (material: MaterialUtilizado) => void;
  removeMaterial: (index: number) => void;
  updateMaterial: (index: number, material: MaterialUtilizado) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
  isValid: boolean;
  generateNumeroRemision: () => Promise<void>;
}

export const useRemisionForm = ({ 
  initialData = {}, 
  onSubmit 
}: UseRemisionFormProps): UseRemisionFormReturn => {
  const [formData, setFormData] = useState<RemisionFormData>({
    ...DEFAULT_REMISION_DATA,
    ...initialData,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((field: keyof RemisionFormData, value: any): string => {
    switch (field) {
      case 'numeroRemision':
        if (!value?.trim()) return 'Número de remisión es requerido';
        if (value.trim().length < VALIDATION_RULES.NUMERO_REMISION_MIN_LENGTH) {
          return `Debe tener al menos ${VALIDATION_RULES.NUMERO_REMISION_MIN_LENGTH} caracteres`;
        }
        break;
      
      case 'fecha':
        if (!value) return 'Fecha es requerida';
        break;
      
      case 'cliente':
        if (!value?.trim()) return 'Cliente es requerido';
        if (value.trim().length < VALIDATION_RULES.CLIENTE_MIN_LENGTH) {
          return `Debe tener al menos ${VALIDATION_RULES.CLIENTE_MIN_LENGTH} caracteres`;
        }
        break;
      
      case 'ubicacion':
        if (!value?.trim()) return 'Ubicación es requerida';
        break;
      
      case 'descripcionTrabajo':
        if (!value?.trim()) return 'Descripción del trabajo es requerida';
        if (value.trim().length < VALIDATION_RULES.DESCRIPCION_MIN_LENGTH) {
          return `Debe tener al menos ${VALIDATION_RULES.DESCRIPCION_MIN_LENGTH} caracteres`;
        }
        break;
      
      case 'tecnicoResponsable':
        if (!value?.trim()) return 'Técnico responsable es requerido';
        break;
      
      case 'tiempoTrabajo':
        if (value && !VALIDATION_RULES.TIEMPO_TRABAJO_PATTERN.test(value)) {
          return 'Formato debe ser HH:MM (ej: 02:30)';
        }
        break;
      
      case 'imagenes':
        if (value && value.length > VALIDATION_RULES.MAX_IMAGENES) {
          return `Máximo ${VALIDATION_RULES.MAX_IMAGENES} imágenes permitidas`;
        }
        break;
      
      default:
        break;
    }
    
    return '';
  }, []);

  const updateField = useCallback((field: keyof RemisionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validar campo en tiempo real
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, [validateField]);

  // Métodos para equipos
  const addEquipo = useCallback((equipo: EquipoUtilizado) => {
    setFormData(prev => ({
      ...prev,
      equiposUtilizados: [...prev.equiposUtilizados, equipo]
    }));
  }, []);

  const removeEquipo = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      equiposUtilizados: prev.equiposUtilizados.filter((_, i) => i !== index)
    }));
  }, []);

  const updateEquipo = useCallback((index: number, equipo: EquipoUtilizado) => {
    setFormData(prev => ({
      ...prev,
      equiposUtilizados: prev.equiposUtilizados.map((item, i) => 
        i === index ? equipo : item
      )
    }));
  }, []);

  // Métodos para materiales
  const addMaterial = useCallback((material: MaterialUtilizado) => {
    setFormData(prev => ({
      ...prev,
      materialesUtilizados: [...prev.materialesUtilizados, material]
    }));
  }, []);

  const removeMaterial = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      materialesUtilizados: prev.materialesUtilizados.filter((_, i) => i !== index)
    }));
  }, []);

  const updateMaterial = useCallback((index: number, material: MaterialUtilizado) => {
    setFormData(prev => ({
      ...prev,
      materialesUtilizados: prev.materialesUtilizados.map((item, i) => 
        i === index ? material : item
      )
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validar campos principales
    const fieldsToValidate: Array<keyof RemisionFormData> = [
      'numeroRemision', 'fecha', 'cliente', 'ubicacion', 
      'descripcionTrabajo', 'tecnicoResponsable', 'tiempoTrabajo', 'imagenes'
    ];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  const generateNumeroRemision = useCallback(async () => {
    try {
      const numeroRemision = await remisionesService.generarNumeroRemision();
      updateField('numeroRemision', numeroRemision);
    } catch (error) {
      console.error('Error al generar número de remisión:', error);
    }
  }, [updateField]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      if (!validateForm()) {
        throw new Error('Por favor, corrija los errores en el formulario');
      }

      await onSubmit(formData);
      
      // Resetear formulario después de envío exitoso
      setFormData({ ...DEFAULT_REMISION_DATA });
      setErrors({});
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, validateForm, isSubmitting]);

  const resetForm = useCallback(() => {
    setFormData({ ...DEFAULT_REMISION_DATA, ...initialData });
    setErrors({});
  }, [initialData]);

  // Generar número de remisión automáticamente si está vacío
  useEffect(() => {
    if (!formData.numeroRemision && !initialData?.numeroRemision) {
      generateNumeroRemision();
    }
  }, [formData.numeroRemision, initialData?.numeroRemision, generateNumeroRemision]);

  const isValid = Object.values(errors).every(error => !error) && 
    Boolean(formData.numeroRemision.trim()) && 
    Boolean(formData.fecha) &&
    Boolean(formData.cliente.trim()) && 
    Boolean(formData.ubicacion.trim()) && 
    Boolean(formData.descripcionTrabajo.trim()) && 
    Boolean(formData.tecnicoResponsable.trim());

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    addEquipo,
    removeEquipo,
    updateEquipo,
    addMaterial,
    removeMaterial,
    updateMaterial,
    handleSubmit,
    resetForm,
    isValid,
    generateNumeroRemision,
  };
};