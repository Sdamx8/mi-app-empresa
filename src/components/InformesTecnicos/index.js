// components/InformesTecnicos/index.js
// Archivo de índice para exportar todos los componentes del módulo

// Exportar el componente principal como default
export { default } from './InformesTecnicos';

// Componentes principales
export { default as InformesTecnicosPage } from './InformesTecnicosPage';
export { default as InformeForm } from './InformeForm';
export { default as InformesTable } from './InformesTable';
export { default as InformesTecnicos } from './InformesTecnicos';

// Componentes de formulario y búsqueda
export { default as BuscarRemisionForm } from './BuscarRemisionForm';

// Componentes de carga de archivos
export { default as UploaderAntes } from './UploaderAntes';
export { default as UploaderDespues } from './UploaderDespues';

// Componente de seguridad
export { default as RoleGuard, useRoleGuard, PermissionCheck } from './RoleGuard';

// Re-exportar servicios relacionados para facilidad de uso
export * from '../../services/firestore';
export * from '../../services/storage';
export * from '../../services/pdf';
