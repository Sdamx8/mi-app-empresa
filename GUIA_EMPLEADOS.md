# Módulo de Gestión de Empleados

## Descripción General
El módulo **Empleados.js** es un sistema integral de gestión de recursos humanos que permite administrar toda la información relacionada con los empleados de la empresa. Es el módulo más completo del sistema, manejando desde datos básicos hasta documentación, evaluaciones y seguridad ocupacional.

## Funcionalidades Principales

### 👥 Gestión Integral de Empleados
- **Registro completo** de empleados con información detallada
- **Edición avanzada** con formulario por secciones
- **Eliminación segura** con confirmación
- **Visualización organizada** en tabla responsive

### 📊 Estadísticas Detalladas
- **Total de empleados** registrados en el sistema
- **Empleados activos** disponibles para trabajo
- **Distribución por tipo**: Técnicos, Administrativos, Directivos
- **Panel de control visual** con métricas importantes

### 🔍 Sistema Avanzado de Filtros
- **Búsqueda textual** en toda la información del empleado
- **Filtro por tipo de empleado** (Técnico, Administrativo, Directivo)
- **Filtro por estado** (Activo, Inactivo, Retirado)
- **Combinación de filtros** para búsquedas específicas

## Estructura del Formulario por Secciones

### 📝 **Sección Básicos**
Información fundamental del empleado:

#### Campos Obligatorios (*)
- **Nombre Completo**: Nombre completo del empleado
- **Identificación**: Número de documento (usado como ID único)
- **Tipo de Empleado**: Técnico, Administrativo o Directivo
- **Cargo**: Posición que desempeña
- **Fecha de Ingreso**: Cuándo comenzó a trabajar

#### Campos Opcionales
- **Estado**: Activo (por defecto), Inactivo, Retirado

### 🎓 **Sección Formación**
Información académica y profesional:

#### Nivel Académico
- **Opciones disponibles**: Primaria, Bachillerato, Técnico, Tecnólogo, Profesional, Especialización, Maestría, Doctorado

#### 🏆 Certificaciones
- **Nombre**: Nombre de la certificación
- **Entidad**: Institución que emite
- **Fecha de Emisión**: Cuándo fue otorgada
- **Fecha de Vencimiento**: Cuándo expira (si aplica)
- **Lista dinámica**: Se pueden agregar múltiples certificaciones

#### 💪 Competencias
- **Agregar competencias**: Una por una con botón de agregar
- **Eliminar competencias**: Botón individual para cada una
- **Visualización en tags**: Diseño moderno y organizado

#### 📊 Evaluaciones
- **Fecha**: Cuándo se realizó la evaluación
- **Evaluador**: Quién condujo la evaluación
- **Resultado**: Calificación o resultado obtenido
- **Observaciones**: Comentarios adicionales
- **Historial completo**: Todas las evaluaciones almacenadas

### 🏥 **Sección Salud**
Seguridad y Salud Ocupacional:

#### Información de Afiliaciones
- **EPS**: Entidad Promotora de Salud
- **ARL**: Administradora de Riesgos Laborales

#### Control Médico
- **Examen Médico de Ingreso**: Fecha del examen inicial
- **Último Examen Médico**: Fecha del examen más reciente
- **Restricciones Médicas**: Limitaciones o recomendaciones

### 📞 **Sección Contacto**
Información de comunicación:

- **Teléfono**: Número de contacto principal
- **Correo Electrónico**: Email del empleado
- **Dirección**: Dirección de residencia

### 📄 **Sección Documentos**
Gestión de archivos y documentación:

#### Tipos de Documentos
- **Cédula**: Documento de identidad
- **Hoja de Vida**: CV o resume
- **Certificados**: Certificaciones y diplomas
- **Exámenes Médicos**: Resultados médicos
- **Contrato**: Documentos contractuales
- **Otros**: Documentos adicionales

#### Información por Documento
- **Tipo**: Categoría del documento
- **URL**: Enlace al archivo (puede ser Google Drive, OneDrive, etc.)
- **Fecha de Subida**: Cuándo se agregó al sistema

## Estados y Clasificaciones

### 👔 **Tipos de Empleado**

#### 🔧 Técnico (Azul)
Personal especializado en trabajos técnicos y operativos.

#### 📋 Administrativo (Verde)
Personal de apoyo administrativo y gestión.

#### 🎯 Directivo (Rojo)
Personal de alta dirección y toma de decisiones.

### 📈 **Estados de Empleado**

#### ✅ Activo (Verde)
Empleado actualmente trabajando en la empresa.

#### ⏸️ Inactivo (Amarillo)
Empleado temporalmente inactivo (licencias, permisos).

#### 🚪 Retirado (Gris)
Ex-empleado que ya no trabaja en la empresa.

## Características Técnicas Avanzadas

### 🚀 **Optimizaciones Implementadas**
- **React Hooks modernos** con useCallback y useMemo
- **Formulario por secciones** para mejor experiencia de usuario
- **Validación robusta** de campos obligatorios
- **Manejo de arrays dinámicos** para certificaciones, competencias, etc.
- **Estados locales optimizados** para cada sección

### 🔥 **Firebase Integration**
- **Firestore Database** con colección `EMPLEADOS`
- **ID por identificación** para evitar duplicados
- **serverTimestamp()** para fechas de creación y actualización
- **Operaciones CRUD** completas optimizadas
- **Manejo de objetos complejos** (formación, contacto, etc.)

### 🎨 **Diseño y UX Avanzada**
- **Navegación por pestañas** entre secciones del formulario
- **Badges de colores** para tipos y estados
- **Iconos descriptivos** para mejor identificación visual
- **Cards organizadas** para información agrupada
- **Animaciones suaves** y transiciones

### 📱 **Responsive Design**
- **Grid adaptativo** que se ajusta a pantallas
- **Tabla responsive** con scroll horizontal en móviles
- **Formulario flexible** que se adapta al contenido

## Guía de Uso Detallada

### 📝 **Registrar Nuevo Empleado**

1. **Clic en "➕ Nuevo Empleado"** en la esquina superior derecha
2. **Completar sección "Básicos"**:
   - Llenar todos los campos obligatorios (*)
   - Seleccionar tipo de empleado apropiado
   - Establecer fecha de ingreso
3. **Navegar a "Formación"** (opcional pero recomendado):
   - Seleccionar nivel académico
   - Agregar certificaciones relevantes
   - Listar competencias técnicas
   - Registrar evaluaciones previas
4. **Completar "Salud"** (importante para compliance):
   - Registrar EPS y ARL
   - Documentar exámenes médicos
   - Anotar restricciones si existen
5. **Agregar "Contacto"**:
   - Incluir teléfono y email
   - Registrar dirección actual
6. **Subir "Documentos"**:
   - Agregar enlaces a documentos importantes
   - Organizar por tipos
7. **Clic en "Registrar Empleado"** para guardar

### ✏️ **Editar Empleado Existente**

1. **Localizar empleado** usando filtros o búsqueda
2. **Clic en "✏️" (Editar)** en la columna de acciones
3. **Navegar entre secciones** usando las pestañas superiores
4. **Modificar información** necesaria en cualquier sección
5. **Agregar nueva información**:
   - Nuevas certificaciones
   - Evaluaciones recientes
   - Documentos actualizados
6. **Clic en "Actualizar Empleado"** para guardar cambios

### 🗑️ **Eliminar Empleado**

1. **Ubicar empleado** en la tabla
2. **Clic en "🗑️" (Eliminar)** en la columna de acciones
3. **Confirmar eliminación** en el diálogo emergente
4. **El empleado se elimina** permanentemente del sistema

### 🔍 **Búsqueda y Filtros Avanzados**

#### Búsqueda Textual
- **Escribir cualquier término** en el campo de búsqueda
- **Busca en todos los campos** incluyendo nombre, cargo, competencias
- **Resultados en tiempo real** mientras se escribe

#### Filtros Específicos
- **Por Tipo**: Ver solo técnicos, administrativos o directivos
- **Por Estado**: Filtrar activos, inactivos o retirados
- **Combinaciones**: Usar múltiples filtros simultáneamente

### 📊 **Análisis de Información**

#### Estadísticas del Dashboard
- **Revisar métricas** en la parte superior
- **Identificar distribución** de personal por tipo
- **Monitorear empleados activos** vs total

#### Gestión de Evaluaciones
- **Programar evaluaciones** basadas en historial
- **Identificar empleados** sin evaluaciones recientes
- **Analizar resultados** por período

## Casos de Uso Empresariales

### 📋 **Gestión de Recursos Humanos**
- **Onboarding de nuevos empleados** con información completa
- **Seguimiento de formación** y desarrollo profesional
- **Control de documentación** laboral y legal
- **Gestión de competencias** por área de trabajo

### 🏥 **Cumplimiento de Seguridad**
- **Control de exámenes médicos** y vencimientos
- **Gestión de restricciones** médicas por puesto
- **Seguimiento de afiliaciones** ARL y EPS
- **Documentación completa** para auditorías

### 📈 **Desarrollo Organizacional**
- **Planificación de capacitaciones** basada en competencias
- **Evaluaciones de desempeño** sistemáticas
- **Identificación de talentos** y áreas de mejora
- **Gestión de carrera** profesional

### 📊 **Reporting y Analytics**
- **Generación de reportes** de personal
- **Análisis de distribución** por tipos y estados
- **Seguimiento de indicadores** de RRHH
- **Métricas de gestión** del talento

## Integración con el Sistema

### 🔗 **Navegación**
- **Acceso desde Dashboard** con botón "👥 Empleados"
- **Integración completa** con sistema de autenticación
- **Constantes compartidas** para consistencia visual

### 📊 **Base de Datos**
- **Colección**: `EMPLEADOS`
- **ID del documento**: Número de identificación del empleado
- **Estructura compleja**: Objetos anidados para organización
- **Campos automáticos**: Timestamps de creación y actualización

### 🎯 **Validaciones y Seguridad**
- **Campos obligatorios** verificados antes de guardar
- **Identificación única** previene duplicados
- **Validación de emails** en campos de contacto
- **Confirmaciones de seguridad** para eliminaciones

## Mantenimiento y Administración

### 🛠️ **Gestión Regular**
- **Actualizar información** de contacto regularmente
- **Revisar vencimientos** de certificaciones
- **Programar exámenes médicos** según fechas
- **Mantener documentos** actualizados

### 📈 **Monitoreo de Performance**
- **Revisar estadísticas** del dashboard
- **Identificar empleados** sin información completa
- **Planificar evaluaciones** pendientes
- **Analizar distribución** de personal

### 🔧 **Solución de Problemas**
- **Verificar conexión** para operaciones de base de datos
- **Revisar permisos** de Firebase para modificaciones
- **Validar URLs** de documentos periódicamente
- **Contactar soporte** para problemas técnicos persistentes

---

**Nota**: Este módulo representa el corazón del sistema de gestión de recursos humanos, proporcionando una plataforma completa para la administración integral del capital humano de la empresa. Su diseño modular y escalable permite adaptarse a las necesidades específicas de crecimiento organizacional.
