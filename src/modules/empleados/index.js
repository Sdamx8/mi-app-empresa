// Exportador principal del módulo Empleados
export { default } from './Empleados';
export { default as Empleados } from './Empleados';

// Exportar servicios del módulo
export * from './services/employeeService';

// Exportar hooks del módulo
export { useEmployeeRefresh } from './hooks/useEmployeeRefresh';
