import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { empleadoSchema, type EmpleadoSchemaType } from '../../../shared/validation';

interface UseEmpleadoFormProps {
  defaultValues?: Partial<EmpleadoSchemaType>;
  onSubmit: (data: EmpleadoSchemaType) => Promise<void>;
}

const defaultFormData: EmpleadoSchemaType = {
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
  defaultValues = {}, 
  onSubmit 
}: UseEmpleadoFormProps) => {
  const form = useForm<EmpleadoSchemaType>({
    resolver: zodResolver(empleadoSchema),
    defaultValues: {
      ...defaultFormData,
      ...defaultValues,
    },
    mode: 'onChange', // Validar en tiempo real
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

  const handleFormSubmit = async (data: EmpleadoSchemaType) => {
    try {
      await onSubmit(data);
      reset(defaultFormData); // Resetear después de envío exitoso
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
    // Métodos de react-hook-form
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
    updateField: (field: keyof EmpleadoSchemaType, value: any) => {
      setValue(field, value, { shouldValidate: true, shouldDirty: true });
    },
  };
};