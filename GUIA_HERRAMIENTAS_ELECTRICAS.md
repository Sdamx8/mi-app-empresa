# Módulo de Herramientas Eléctricas

## Descripción General
El módulo **HerramientaElectrica.js** es un sistema completo de administración para el inventario de herramientas eléctricas de la empresa. Permite registrar, gestionar y realizar seguimiento del estado de las herramientas.

## Funcionalidades Principales

### 🔧 Gestión de Herramientas
- **Agregar nuevas herramientas** con información completa
- **Editar herramientas existentes** con validación de datos
- **Eliminar herramientas** con confirmación de seguridad
- **Visualización en tabla** con información organizada

### 📊 Estadísticas en Tiempo Real
- **Total de herramientas** registradas
- **Herramientas operativas** disponibles para uso
- **Herramientas en mantenimiento** temporal
- **Herramientas fuera de servicio** que requieren atención

### 🔍 Sistema de Búsqueda y Filtros
- **Búsqueda textual** en todos los campos de las herramientas
- **Filtro por estado** para ver herramientas específicas
- **Búsqueda en tiempo real** sin necesidad de botones

### 📝 Campos de Información

#### Campos Obligatorios (*)
- **Serial Interno**: Código único de la empresa
- **Serial de Máquina**: Serial del fabricante
- **Descripción**: Descripción detallada de la herramienta
- **Lugar**: Ubicación actual de la herramienta
- **Estado**: Estado operativo actual
- **Técnico Encargado**: Responsable de la herramienta

#### Campos Opcionales
- **Fecha de Fabricación**: Cuándo fue fabricada
- **Fecha de Compra**: Cuándo fue adquirida
- **Factura**: Número de factura de compra
- **Mantenimiento Preventivo**: Detalles del mantenimiento programado
- **Mantenimiento Correctivo**: Detalles de reparaciones realizadas
- **Persona Mantenimiento**: Quien realizó el mantenimiento
- **Fecha de Inspección**: Última inspección realizada
- **Persona Inspección**: Quien realizó la inspección

## Estados Disponibles

### ✅ Operativo (Verde)
Herramienta en perfecto estado y disponible para uso inmediato.

### ⚠️ En Mantenimiento (Amarillo)
Herramienta temporalmente fuera de servicio por mantenimiento programado.

### ❌ Fuera de Servicio (Rojo)
Herramienta que no puede ser utilizada debido a fallas o daños.

### 🔍 En Revisión (Azul)
Herramienta siendo evaluada para determinar su estado operativo.

### 🔧 En Reparación (Naranja)
Herramienta siendo reparada activamente.

## Características Técnicas

### 🚀 Optimizaciones Implementadas
- **React Hooks** para manejo eficiente del estado
- **Memoización** para prevenir re-renderizados innecesarios
- **Validación en tiempo real** de formularios
- **Manejo de errores** robusto con mensajes informativos
- **Interfaz responsiva** que se adapta a diferentes pantallas

### 🔥 Firebase Integration
- **Firestore Database** para almacenamiento en tiempo real
- **serverTimestamp()** para control automático de fechas
- **Operaciones CRUD** completas (Create, Read, Update, Delete)
- **Manejo de errores** específicos de Firebase

### 🎨 Diseño y UX
- **Interfaz moderna** con diseño material
- **Códigos de color** específicos por estado
- **Animaciones suaves** para transiciones
- **Feedback visual** inmediato para todas las acciones
- **Confirmaciones de seguridad** para acciones críticas

## Guía de Uso

### 📝 Agregar Nueva Herramienta

1. **Clic en "➕ Nueva Herramienta"** en la parte superior derecha
2. **Llenar campos obligatorios** marcados con asterisco (*)
3. **Seleccionar estado** apropiado de la lista desplegable
4. **Clic en "Guardar"** para crear la herramienta
5. **Confirmación visual** aparecerá al completar exitosamente

### ✏️ Editar Herramienta Existente

1. **Localizar la herramienta** en la tabla
2. **Clic en el botón "✏️" (Editar)** en la columna de acciones
3. **Modificar los campos** necesarios en el formulario
4. **Clic en "Actualizar"** para guardar los cambios
5. **Verificar cambios** en la tabla actualizada

### 🗑️ Eliminar Herramienta

1. **Localizar la herramienta** en la tabla
2. **Clic en el botón "🗑️" (Eliminar)** en la columna de acciones
3. **Confirmar eliminación** en el diálogo que aparece
4. **La herramienta desaparecerá** de la tabla inmediatamente

### 🔍 Buscar y Filtrar

#### Búsqueda Textual
- **Escribir en el campo de búsqueda** cualquier término
- **La tabla se filtra automáticamente** mostrando coincidencias
- **Busca en todos los campos** de las herramientas

#### Filtro por Estado
- **Seleccionar estado específico** en el menú desplegable
- **"Todos los estados"** muestra todas las herramientas
- **Combinar con búsqueda textual** para filtros más específicos

## Integración con el Sistema

### 🔗 Navegación
- **Accesible desde el Dashboard principal** con el botón "⚡ Herramientas"
- **Integrado completamente** con el sistema de autenticación
- **Compartir constantes y estilos** con otros módulos

### 📊 Base de Datos
- **Colección**: `HERRAMIENTA_ELECTRICA`
- **ID del documento**: Serial interno de la empresa
- **Campos automáticos**: `fecha_creacion`, `fecha_actualizacion`

### 🎯 Validaciones
- **Campos obligatorios** verificados antes de guardar
- **Serial interno único** previene duplicados
- **Formatos de fecha** validados automáticamente
- **Mensajes de error claros** para mejor experiencia

## Mantenimiento y Soporte

### 🛠️ Mantenimiento Preventivo
- **Monitorear regularmente** las fechas de inspección
- **Actualizar estados** según el programa de mantenimiento
- **Mantener información actualizada** de técnicos responsables

### 📈 Análisis de Datos
- **Revisar estadísticas** en el panel superior
- **Identificar herramientas** que requieren atención
- **Programar mantenimientos** basados en historial

### 🔧 Solución de Problemas
- **Verificar conexión a internet** si hay errores de carga
- **Revisar permisos de Firebase** si no se pueden guardar datos
- **Contactar soporte técnico** para problemas persistentes

---

**Nota**: Este módulo forma parte del sistema integral de gestión empresarial y mantiene consistencia con los estándares de código y diseño establecidos en el proyecto.
