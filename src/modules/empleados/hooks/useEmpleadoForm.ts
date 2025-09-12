import { useState, useCallback } from 'react';
import type { EmpleadoFormData } from '../types';
import { VALIDATION_RULES } from '../constants';

interface UseEmpleadoFormProps {
  initialData?: Partial<EmpleadoFormData>;
  onSubmit: (data: EmpleadoFormData) => Promise<void>;
}

interface UseEmpleadoFormReturn {
  formData: EmpleadoFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  updateField: (field: keyof EmpleadoFormData, value: any) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
  isValid: boolean;
}

const defaultFormData: EmpleadoFormData = {
  nombre: '',
  apellido: '',
  cedula: '',
  email: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
  fechaIngreso: new Date().toISOString().split('T')[0],
  tipo: 'tecnico',
  estado: 'activo',
  nivelAcademico: 'Bachillerato',
  cargo: '',
  salario: 0,
};

export const useEmpleadoForm = ({ 
  initialData = {}, 
  onSubmit 
}: UseEmpleadoFormProps): UseEmpleadoFormReturn => {
  const [formData, setFormData] = useState<EmpleadoFormData>({
    ...defaultFormData,
    ...initialData,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((field: keyof EmpleadoFormData, value: any): string => {
    switch (field) {
      case 'nombre':
      case 'apellido':
        if (!value?.trim()) return `${field === 'nombre' ? 'Nombre' : 'Apellido'} es requerido`;
        if (value.trim().length < VALIDATION_RULES.NOMBRE_MIN_LENGTH) {
          return `${field === 'nombre' ? 'Nombre' : 'Apellido'} debe tener al menos ${VALIDATION_RULES.NOMBRE_MIN_LENGTH} caracteres`;
        }
        break;
      
      case 'cedula':
        if (!value?.trim()) return 'Cédula es requerida';
        if (value.trim().length < VALIDATION_RULES.CEDULA_LENGTH) {
          return `Cédula debe tener al menos ${VALIDATION_RULES.CEDULA_LENGTH} caracteres`;
        }
        break;
      
      case 'email':
        if (!value?.trim()) return 'Email es requerido';
        if (!VALIDATION_RULES.EMAIL_PATTERN.test(value)) {
          return 'Email no tiene un formato válido';
        }
        break;
      
      case 'telefono':
        if (!value?.trim()) return 'Teléfono es requerido';
        if (value.trim().length < VALIDATION_RULES.TELEFONO_MIN_LENGTH) {
          return `Teléfono debe tener al menos ${VALIDATION_RULES.TELEFONO_MIN_LENGTH} caracteres`;
        }
        break;
      
      case 'cargo':
        if (!value?.trim()) return 'Cargo es requerido';
        break;
      
      case 'salario':
        if (value && value < VALIDATION_RULES.SALARIO_MIN) {
          return 'Salario no puede ser negativo';
        }
        break;
      
      default:
        break;
    }
    
    return '';
  }, []);

  const updateField = useCallback((field: keyof EmpleadoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validar campo en tiempo real
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, [validateField]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validar todos los campos
    (Object.keys(formData) as Array<keyof EmpleadoFormData>).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      if (!validateForm()) {
        throw new Error('Por favor, corrija los errores en el formulario');
      }

      await onSubmit(formData);
      
      // Resetear formulario después de envío exitoso
      setFormData(defaultFormData);
      setErrors({});
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, validateForm, isSubmitting]);

  const resetForm = useCallback(() => {
    setFormData({ ...defaultFormData, ...initialData });
    setErrors({});
  }, [initialData]);

  const isValid = Object.values(errors).every(error => !error) && 
    Boolean(formData.nombre.trim()) && 
    Boolean(formData.apellido.trim()) && 
    Boolean(formData.cedula.trim()) && 
    Boolean(formData.email.trim()) && 
    Boolean(formData.telefono.trim()) && 
    Boolean(formData.cargo.trim());

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit,
    resetForm,
    isValid,
  };
};