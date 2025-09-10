// Exportador principal del módulo Ingresar Trabajo
export { default } from './IngresarTrabajo';
export { default as IngresarTrabajo } from './IngresarTrabajo';

// Exportar componentes del módulo
export { default as FormularioRemision } from './components/FormularioRemision';

// Exportar servicios del módulo
export * from './services/remisionesService';

// Exportar hooks del módulo
export { default as useFormRemision } from './hooks/useFormRemision';
