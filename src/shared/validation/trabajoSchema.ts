import { z } from 'zod';

// Esquemas de validación para trabajos
export const trabajoSchema = z.object({
  cliente: z.string()
    .min(2, 'El nombre del cliente debe tener al menos 2 caracteres')
    .max(100, 'El nombre del cliente no puede exceder 100 caracteres'),
  
  contacto: z.string()
    .min(2, 'El contacto debe tener al menos 2 caracteres')
    .max(100, 'El contacto no puede exceder 100 caracteres'),
  
  telefono: z.string()
    .min(7, 'El teléfono debe tener al menos 7 caracteres')
    .max(15, 'El teléfono no puede exceder 15 caracteres')
    .regex(/^[0-9+\-\s]+$/, 'El teléfono solo puede contener números, +, - y espacios'),
  
  direccion: z.string()
    .min(10, 'La dirección debe tener al menos 10 caracteres')
    .max(200, 'La dirección no puede exceder 200 caracteres'),
  
  tipoServicio: z.enum([
    'Instalación', 'Reparación', 'Mantenimiento', 
    'Diagnóstico', 'Consultoría', 'Emergencia'
  ], {
    message: 'Tipo de servicio inválido'
  }),
  
  descripcion: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),
  
  fecha: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD'),
  
  horaInicio: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'La hora debe tener el formato HH:MM'),
  
  horaFin: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'La hora debe tener el formato HH:MM')
    .optional(),
  
  estado: z.enum([
    'pendiente', 'en-progreso', 'completado', 
    'cancelado', 'postpuesto'
  ], {
    message: 'Estado inválido'
  }),
  
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente'], {
    message: 'Prioridad inválida'
  }),
  
  tecnicoAsignado: z.string()
    .min(1, 'Debe asignar un técnico')
    .optional(),
  
  materiales: z.array(z.object({
    nombre: z.string().min(1, 'El nombre del material es requerido'),
    cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
    precio: z.number().min(0, 'El precio no puede ser negativo').optional()
  })).optional(),
  
  costoEstimado: z.number()
    .min(0, 'El costo no puede ser negativo')
    .optional(),
  
  costoFinal: z.number()
    .min(0, 'El costo no puede ser negativo')
    .optional(),
  
  observaciones: z.string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional()
}).refine(data => {
  if (data.horaFin && data.horaInicio) {
    const inicio = new Date(`2000-01-01T${data.horaInicio}:00`);
    const fin = new Date(`2000-01-01T${data.horaFin}:00`);
    return fin > inicio;
  }
  return true;
}, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['horaFin']
});

// Tipo TypeScript derivado del esquema
export type TrabajoSchemaType = z.infer<typeof trabajoSchema>;