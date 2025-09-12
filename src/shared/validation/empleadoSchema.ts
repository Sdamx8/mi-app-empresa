import { z } from 'zod';

// Esquemas de validación para empleados
export const empleadoSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'El nombre solo puede contener letras'),
  
  apellido: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'El apellido solo puede contener letras'),
  
  cedula: z.string()
    .min(7, 'La cédula debe tener al menos 7 caracteres')
    .max(10, 'La cédula no puede exceder 10 caracteres')
    .regex(/^[0-9]+$/, 'La cédula solo puede contener números'),
  
  email: z.string()
    .email('El email no tiene un formato válido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  
  telefono: z.string()
    .min(7, 'El teléfono debe tener al menos 7 caracteres')
    .max(15, 'El teléfono no puede exceder 15 caracteres')
    .regex(/^[0-9+\-\s]+$/, 'El teléfono solo puede contener números, +, - y espacios'),
  
  direccion: z.string()
    .min(10, 'La dirección debe tener al menos 10 caracteres')
    .max(200, 'La dirección no puede exceder 200 caracteres'),
  
  fechaNacimiento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD')
    .refine(date => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 65;
    }, 'La edad debe estar entre 18 y 65 años'),
  
  fechaIngreso: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD')
    .refine(date => {
      const ingressDate = new Date(date);
      const today = new Date();
      return ingressDate <= today;
    }, 'La fecha de ingreso no puede ser futura'),
  
  tipo: z.enum(['tecnico', 'administrativo', 'directivo'], {
    message: 'El tipo debe ser técnico, administrativo o directivo'
  }),
  
  estado: z.enum(['activo', 'inactivo', 'retirado'], {
    message: 'El estado debe ser activo, inactivo o retirado'
  }),
  
  nivelAcademico: z.enum([
    'Primaria', 'Bachillerato', 'Técnico', 'Tecnólogo', 
    'Profesional', 'Especialización', 'Maestría', 'Doctorado'
  ], {
    message: 'Nivel académico inválido'
  }),
  
  cargo: z.string()
    .min(2, 'El cargo debe tener al menos 2 caracteres')
    .max(100, 'El cargo no puede exceder 100 caracteres'),
  
  salario: z.number()
    .min(0, 'El salario no puede ser negativo')
    .max(50000000, 'El salario no puede exceder $50,000,000')
    .optional()
});

// Tipo TypeScript derivado del esquema
export type EmpleadoSchemaType = z.infer<typeof empleadoSchema>;