import { z } from 'zod';

// Esquemas de validación para remisiones
export const remisionSchema = z.object({
  numeroRemision: z.string()
    .min(1, 'El número de remisión es requerido')
    .max(20, 'El número de remisión no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9\-]+$/, 'Solo se permiten letras mayúsculas, números y guiones'),
  
  fecha: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD'),
  
  cliente: z.object({
    nombre: z.string()
      .min(2, 'El nombre del cliente debe tener al menos 2 caracteres')
      .max(100, 'El nombre del cliente no puede exceder 100 caracteres'),
    nit: z.string()
      .min(5, 'El NIT debe tener al menos 5 caracteres')
      .max(15, 'El NIT no puede exceder 15 caracteres')
      .regex(/^[0-9\-]+$/, 'El NIT solo puede contener números y guiones'),
    direccion: z.string()
      .min(10, 'La dirección debe tener al menos 10 caracteres')
      .max(200, 'La dirección no puede exceder 200 caracteres'),
    telefono: z.string()
      .min(7, 'El teléfono debe tener al menos 7 caracteres')
      .max(15, 'El teléfono no puede exceder 15 caracteres')
      .regex(/^[0-9+\-\s]+$/, 'El teléfono solo puede contener números, +, - y espacios')
  }),
  
  items: z.array(z.object({
    codigo: z.string()
      .min(1, 'El código del item es requerido')
      .max(20, 'El código no puede exceder 20 caracteres'),
    descripcion: z.string()
      .min(3, 'La descripción debe tener al menos 3 caracteres')
      .max(200, 'La descripción no puede exceder 200 caracteres'),
    cantidad: z.number()
      .min(0.01, 'La cantidad debe ser mayor a 0')
      .max(9999, 'La cantidad no puede exceder 9999'),
    valorUnitario: z.number()
      .min(0, 'El valor unitario no puede ser negativo')
      .max(999999999, 'El valor unitario no puede exceder $999,999,999'),
    valorTotal: z.number()
      .min(0, 'El valor total no puede ser negativo'),
    observaciones: z.string()
      .max(200, 'Las observaciones no pueden exceder 200 caracteres')
      .optional()
  }))
  .min(1, 'Debe agregar al menos un item')
  .max(50, 'No puede agregar más de 50 items'),
  
  observaciones: z.string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional(),
  
  estado: z.enum(['borrador', 'enviada', 'aceptada', 'rechazada', 'anulada'], {
    message: 'Estado de remisión inválido'
  }),
  
  subtotal: z.number()
    .min(0, 'El subtotal no puede ser negativo'),
  
  iva: z.number()
    .min(0, 'El IVA no puede ser negativo')
    .max(100, 'El IVA no puede exceder el 100%'),
  
  total: z.number()
    .min(0, 'El total no puede ser negativo'),
  
  metodoPago: z.enum([
    'efectivo', 'transferencia', 'cheque', 'tarjeta-credito', 'tarjeta-debito'
  ], {
    message: 'Método de pago inválido'
  }).optional(),
  
  fechaVencimiento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD')
    .optional()
}).refine(data => {
  // Validar que los totales de items coincidan con el subtotal
  const itemsTotal = data.items.reduce((sum, item) => sum + item.valorTotal, 0);
  return Math.abs(itemsTotal - data.subtotal) < 0.01;
}, {
  message: 'El subtotal debe coincidir con la suma de los items',
  path: ['subtotal']
}).refine(data => {
  // Validar que el total sea correcto (subtotal + iva)
  const expectedTotal = data.subtotal + (data.subtotal * data.iva / 100);
  return Math.abs(expectedTotal - data.total) < 0.01;
}, {
  message: 'El total debe ser igual al subtotal más el IVA',
  path: ['total']
}).refine(data => {
  // Validar que cada item tenga el valor total correcto
  return data.items.every(item => 
    Math.abs((item.cantidad * item.valorUnitario) - item.valorTotal) < 0.01
  );
}, {
  message: 'El valor total de cada item debe ser igual a cantidad × valor unitario',
  path: ['items']
}).refine(data => {
  // Validar que la fecha de vencimiento sea posterior a la fecha de emisión
  if (data.fechaVencimiento) {
    const fechaEmision = new Date(data.fecha);
    const fechaVenc = new Date(data.fechaVencimiento);
    return fechaVenc > fechaEmision;
  }
  return true;
}, {
  message: 'La fecha de vencimiento debe ser posterior a la fecha de emisión',
  path: ['fechaVencimiento']
});

// Tipo TypeScript derivado del esquema
export type RemisionSchemaType = z.infer<typeof remisionSchema>;