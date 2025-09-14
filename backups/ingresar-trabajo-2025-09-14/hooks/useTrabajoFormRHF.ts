import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trabajoSchema, type TrabajoSchemaType } from '../../../shared/validation';

interface UseTrabajoFormProps {
  defaultValues?: Partial<TrabajoSchemaType>;
  onSubmit: (data: TrabajoSchemaType) => Promise<void>;
}

const defaultFormData: TrabajoSchemaType = {
  cliente: '',
  contacto: '',
  telefono: '',
  direccion: '',
  tipoServicio: 'Instalación',
  descripcion: '',
  fecha: new Date().toISOString().split('T')[0],
  horaInicio: '08:00',
  horaFin: undefined,
  estado: 'pendiente',
  prioridad: 'media',
  tecnicoAsignado: undefined,
  materiales: undefined,
  costoEstimado: undefined,
  costoFinal: undefined,
  observaciones: undefined,
};

export const useTrabajoForm = ({ 
  defaultValues = {}, 
  onSubmit 
}: UseTrabajoFormProps) => {
  const form = useForm<TrabajoSchemaType>({
    resolver: zodResolver(trabajoSchema),
    defaultValues: {
      ...defaultFormData,
      ...defaultValues,
    },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    setValue,
    getValues,
    watch,
  } = form;

  const handleFormSubmit = async (data: TrabajoSchemaType) => {
    try {
      await onSubmit(data);
      reset(defaultFormData);
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      throw error;
    }
  };

  const resetForm = () => {
    reset({
      ...defaultFormData,
      ...defaultValues,
    });
  };

  return {
    control,
    handleSubmit: handleSubmit(handleFormSubmit),
    errors,
    isSubmitting,
    isValid,
    reset: resetForm,
    setValue,
    getValues,
    watch,
    
    // Métodos adicionales para compatibilidad
    formData: getValues(),
    updateField: (field: keyof TrabajoSchemaType, value: any) => {
      setValue(field, value, { shouldValidate: true, shouldDirty: true });
    },
  };
};