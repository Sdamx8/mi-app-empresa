# Módulo de Herramientas Manuales

## Descripción General
El módulo **HerramientaManual.js** es un sistema completo de administración para el inventario de herramientas manuales de la empresa. Permite registrar, gestionar y realizar seguimiento del estado y asignación de las herramientas manuales.

## Funcionalidades Principales

### 🔨 Gestión de Herramientas Manuales
- **Agregar nuevas herramientas** con información completa
- **Editar herramientas existentes** con validación de datos
- **Eliminar herramientas** con confirmación de seguridad
- **Visualización en tabla** con información organizada
- **Control de asignaciones** a técnicos específicos

### 📊 Estadísticas en Tiempo Real
- **Total de herramientas** manuales registradas
- **Herramientas disponibles** listas para asignación
- **Herramientas asignadas** actualmente en uso
- **Herramientas en mantenimiento** temporal
- **Herramientas problemáticas** (dañadas o perdidas)

### 🔍 Sistema de Búsqueda y Filtros
- **Búsqueda textual** en todos los campos de las herramientas
- **Filtro por estado** para ver herramientas específicas
- **Búsqueda en tiempo real** sin necesidad de botones

### 📝 Campos de Información

#### Campos Obligatorios (*)
- **Código Interno**: Código único de identificación
- **Descripción**: Descripción detallada de la herramienta
- **Estado**: Estado actual de la herramienta
- **Lugar**: Ubicación actual de la herramienta
- **Técnico Encargado**: Responsable de la herramienta

#### Campos Opcionales
- **Fecha de Asignación**: Cuándo fue asignada la herramienta

## Estados Disponibles

### ✅ Disponible (Verde)
Herramienta lista para ser asignada y utilizada.

### 📋 Asignada (Azul)
Herramienta actualmente asignada a un técnico específico.

### ⚠️ En Mantenimiento (Amarillo)
Herramienta temporalmente fuera de servicio por mantenimiento programado.

### ❌ Perdida (Rojo)
Herramienta que se ha extraviado o no se puede localizar.

### 🔧 Dañada (Gris)
Herramienta que presenta fallas o daños que impiden su uso.

### ⬇️ Dada de Baja (Negro)
Herramienta retirada permanentemente del inventario.

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
- **IDs automáticos** generados por Firebase para cada herramienta

### 🎨 Diseño y UX
- **Interfaz moderna** con diseño material
- **Códigos de color** específicos por estado
- **Animaciones suaves** para transiciones
- **Feedback visual** inmediato para todas las acciones
- **Confirmaciones de seguridad** para acciones críticas

## Guía de Uso

### 📝 Agregar Nueva Herramienta Manual

1. **Clic en "➕ Nueva Herramienta"** en la parte superior derecha
2. **Llenar campos obligatorios** marcados con asterisco (*)
3. **Seleccionar estado** apropiado de la lista desplegable
4. **Agregar fecha de asignación** si corresponde
5. **Clic en "Guardar"** para crear la herramienta
6. **Confirmación visual** aparecerá al completar exitosamente

### ✏️ Editar Herramienta Existente

1. **Localizar la herramienta** en la tabla
2. **Clic en el botón "✏️" (Editar)** en la columna de acciones
3. **Modificar los campos** necesarios en el formulario
4. **Actualizar estado** si es necesario (ej: cambiar de "Disponible" a "Asignada")
5. **Clic en "Actualizar"** para guardar los cambios
6. **Verificar cambios** en la tabla actualizada

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

## Casos de Uso Comunes

### 🔄 Asignación de Herramientas
1. **Buscar herramienta disponible** usando filtros
2. **Editar la herramienta** seleccionada
3. **Cambiar estado** de "Disponible" a "Asignada"
4. **Agregar fecha de asignación** actual
5. **Actualizar técnico encargado** si es necesario

### 🔧 Registro de Mantenimiento
1. **Localizar herramienta** que necesita mantenimiento
2. **Cambiar estado** a "En Mantenimiento"
3. **Actualizar lugar** si se mueve a taller
4. **Documentar en descripción** el tipo de mantenimiento

### 📦 Control de Inventario
1. **Revisar estadísticas** en el panel superior
2. **Identificar herramientas perdidas** o dañadas
3. **Actualizar estados** según inspecciones
4. **Dar de baja herramientas** irreparables

## Integración con el Sistema

### 🔗 Navegación
- **Accesible desde el Dashboard principal** con el botón "🔨 Manuales"
- **Integrado completamente** con el sistema de autenticación
- **Compartir constantes y estilos** con otros módulos

### 📊 Base de Datos
- **Colección**: `HERRAMIENTA_MANUAL`
- **ID del documento**: Generado automáticamente por Firebase
- **Campos automáticos**: `fecha_creacion`, `fecha_actualizacion`

### 🎯 Validaciones
- **Campos obligatorios** verificados antes de guardar
- **Códigos internos únicos** recomendados para evitar confusiones
- **Formatos de fecha** validados automáticamente
- **Mensajes de error claros** para mejor experiencia

## Diferencias con Herramientas Eléctricas

### 🔋 vs 🔨 Características Distintivas

| Característica | Herramientas Eléctricas | Herramientas Manuales |
|---|---|---|
| **Estados** | Operativo, Mantenimiento, Fuera de Servicio, Revisión, Reparación | Disponible, Asignada, Mantenimiento, Perdida, Dañada, Baja |
| **Enfoque** | Mantenimiento técnico especializado | Control de asignaciones y disponibilidad |
| **Complejidad** | Mayor (serial de fábrica, fechas de compra, facturas) | Menor (código interno, asignación simple) |
| **Uso** | Equipos costosos con mantenimiento programado | Herramientas básicas de uso diario |

## Mantenimiento y Soporte

### 🛠️ Gestión de Inventario
- **Revisar regularmente** herramientas perdidas o dañadas
- **Actualizar asignaciones** según cambios de personal
- **Mantener códigos internos** únicos y descriptivos

### 📈 Análisis de Datos
- **Monitorear estadísticas** de disponibilidad
- **Identificar herramientas** más solicitadas
- **Planificar compras** basadas en demanda

### 🔧 Solución de Problemas
- **Verificar conexión a internet** si hay errores de carga
- **Revisar permisos de Firebase** si no se pueden guardar datos
- **Contactar soporte técnico** para problemas persistentes

---

**Nota**: Este módulo complementa el sistema de herramientas eléctricas proporcionando un control específico para herramientas manuales con enfoque en asignaciones y disponibilidad inmediata.
