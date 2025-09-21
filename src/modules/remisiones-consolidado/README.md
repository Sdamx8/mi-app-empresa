# 📊 Módulo Remisiones Consolidado

## Descripción
Módulo independiente que permite ingresar remisiones con funcionalidad completa de adjuntos (orden PDF + remisión escaneada), creación de informes técnicos con fotos antes/después, y generación automática de PDF consolidado que combina todos los documentos en uno solo.

## Características Principales

### ✅ **Interfaz Hoja de Cálculo**
- Vista tipo Google Sheets basada en el componente original
- Edición inline de todas las columnas de remisión
- Validaciones en tiempo real
- Guardado en batch a Firestore

### 📎 **Gestión de Adjuntos**
- **Orden de Trabajo**: Subida de PDF (obligatorio para consolidado completo)
- **Remisión Escaneada**: Subida de PDF o imagen (JPG, PNG, WEBP)
- Almacenamiento en Firebase Storage con rutas organizadas
- Validación de tipos de archivo y tamaños máximos

### 📋 **Informe Técnico**
- Modal para capturar descripción detallada de trabajos
- Sección de observaciones adicionales
- Carga múltiple de fotos "antes" y "después"
- Previsualización de imágenes con gestión de archivos
- Validaciones obligatorias para completitud

### 📄 **PDF Consolidado**
- Combinación automática en orden específico:
  1. Orden de trabajo (o página de resumen si no está adjunta)
  2. Remisión escaneada (convertida a PDF si es imagen)
  3. Informe técnico generado (con fotos organizadas)
- Nomenclatura: `<NO_ORDEN>_<MOVIL>.pdf`
- Almacenamiento: `remisiones/<remisionId>/consolidado/`
- Re-generación permitida con versionado

## Estructura del Módulo

```
src/modules/remisiones-consolidado/
├── components/
│   ├── RemisionesSpreadsheet.jsx     # Componente principal
│   ├── RemisionesSpreadsheet.css     # Estilos base (copia del original)
│   ├── AdjuntosUploader.jsx          # Componente de subida de archivos
│   └── ModalInformeTecnico.jsx       # Modal para crear informes
├── hooks/
│   ├── useRemisionesConsolidado.js   # Gestión de remisiones y adjuntos
│   └── useInformeConsolidado.js      # Gestión específica de informes
├── lib/
│   └── pdfMerge.js                   # Funciones de combinación de PDFs
├── styles/
│   └── RemisionesConsolidado.css     # Estilos específicos del módulo
└── README.md                         # Esta documentación
```

## Instalación y Configuración

### Dependencias Requeridas

```bash
npm install pdf-lib --legacy-peer-deps
```

### Variables de Entorno

El módulo utiliza las mismas configuraciones de Firebase que el proyecto principal:

```env
# Ya configuradas en firebaseConfig.js
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
# ... etc
```

### Reglas de Firestore y Storage

**Firestore Rules** (agregar a firestore.rules):
```javascript
// Reglas para remisiones consolidado
match /remisiones/{remisionId} {
  allow read, write: if request.auth != null;
  
  match /informesTecnicos/{informeId} {
    allow read, write: if request.auth != null;
  }
}
```

**Storage Rules** (agregar a storage.rules):
```javascript
// Reglas para archivos de remisiones
match /remisiones/{remisionId}/{allPaths=**} {
  allow read, write: if request.auth != null 
    && request.resource.size < 10 * 1024 * 1024; // Max 10MB
}
```

## Uso del Módulo

### 1. Importar el Componente

```jsx
import RemisionesSpreadsheet from './modules/remisiones-consolidado/components/RemisionesSpreadsheet';

function App() {
  return (
    <div>
      <RemisionesSpreadsheet />
    </div>
  );
}
```

### 2. Flujo de Trabajo Típico

1. **Crear Remisión**: Llenar campos obligatorios (remisión, móvil, servicio1, fecha)
2. **Guardar**: Hacer clic en "Guardar Remisiones" para obtener ID de Firestore
3. **Subir Adjuntos**: Usar columna "Adjuntos" para subir orden PDF y remisión
4. **Crear Informe**: Usar columna "Informe" para abrir modal y capturar datos técnicos
5. **Generar Consolidado**: Usar columna "Consolidado" para crear PDF final

### 3. Validaciones Automáticas

- **Remisión incompleta**: Filas con campos faltantes se marcan en rojo
- **Adjuntos**: Requiere remisión guardada en Firestore
- **Informe**: Requiere descripción y al menos 1 foto antes/después
- **Consolidado**: Valida orden, móvil y disponibilidad de datos

## Estructura de Datos

### Documento Remisión (Firestore)
```javascript
{
  // Campos originales de remisión
  remision: "1262",
  movil: "BO-0177", 
  no_orden: "AM785858",
  estado: "GENERADO",
  // ... otros campos estándar
  
  // Campos específicos de consolidado
  adjuntos: {
    orden_url: "https://..../orden.pdf",
    remision_url: "https://..../remision.pdf"
  },
  informe_status: "consolidado", // 'pendiente' | 'creado' | 'consolidado'
  consolidado_url: "https://..../AM785858_BO-0177.pdf",
  consolidado_creado_en: Timestamp,
  consolidado_creado_por: "user@example.com",
  consolidado_nombre_archivo: "AM785858_BO-0177.pdf"
}
```

### Subcolección InformesTecnicos
```javascript
{
  descripcion_trabajos: "Detalle de trabajos realizados...",
  observaciones: "Observaciones adicionales...",
  fotos_antes: [
    {
      url: "https://..../antes_1.jpg",
      nombre: "antes_1_1695123456.jpg", 
      subido_en: Date
    }
  ],
  fotos_despues: [
    {
      url: "https://..../despues_1.jpg",
      nombre: "despues_1_1695123456.jpg",
      subido_en: Date  
    }
  ],
  pdf_generado: "https://..../informe.pdf",
  creado_por: "user@example.com",
  creado_en: Timestamp,
  estado_informe: "pdf_generado"
}
```

## Rutas de Almacenamiento

### Firebase Storage

```
remisiones/
└── {remisionId}/
    ├── adjuntos/
    │   ├── orden.pdf
    │   └── remision.pdf
    ├── fotos/
    │   ├── antes/
    │   │   ├── antes_1_1695123456.jpg
    │   │   └── antes_2_1695123457.jpg
    │   └── despues/
    │       ├── despues_1_1695123458.jpg
    │       └── despues_2_1695123459.jpg
    ├── informes/
    │   └── informe_1262_1695123460.pdf
    └── consolidado/
        └── AM785858_BO-0177.pdf
```

## API Hooks Disponibles

### useRemisionesConsolidado()

```javascript
const {
  saveRemisionConsolidado,    // Guardar remisiones con estructura consolidado
  uploadAdjuntos,             // Subir orden PDF y remisión escaneada  
  checkRemisionExists,        // Verificar si remisión ya existe
  getRemisionById,            // Obtener remisión por ID
  loading,                    // Estado de carga
  error                       // Error si ocurre
} = useRemisionesConsolidado();
```

### useInformeConsolidado()

```javascript
const {
  generateInformePDF,         // Generar PDF solo del informe
  validateInformeData,        // Validar datos del informe
  getAllInformesForRemision,  // Obtener todos los informes
  getLatestInforme,           // Obtener informe más reciente
  updateInformeStatus,        // Actualizar estado del informe
  getInformeStats,            // Estadísticas del informe
  loading,
  error
} = useInformeConsolidado();
```

## Librería PDF Utilizada

### pdf-lib

**Selección**: Elegimos `pdf-lib` por las siguientes razones:

1. **Calidad sin pérdida**: Mantiene la calidad original de PDFs e imágenes
2. **Manipulación completa**: Permite crear, modificar y combinar PDFs
3. **Compatibilidad**: Funciona en navegadores sin dependencias del backend
4. **Tamaño**: Librería liviana comparada con alternativas
5. **Soporte**: Activamente mantenida con buena documentación

**Alternativas consideradas**:
- `jsPDF`: Limitado para combinar PDFs existentes
- `PDF.js`: Más orientado a visualización que creación
- `react-pdf`: Requiere componentes específicos de React

## Criterios de Aceptación

### Caso de Prueba 1: Flujo Completo Exitoso

**Escenario**: Usuario crea remisión con todos los adjuntos e informe
**Pasos**:
1. Crear remisión con datos: `remision: "TEST001", movil: "BO-0001", no_orden: "TEST123", servicio1: [seleccionar]`
2. Guardar la remisión
3. Subir orden PDF (max 10MB)
4. Subir remisión escaneada (imagen o PDF, max 10MB)  
5. Crear informe técnico con descripción y 2 fotos antes/después
6. Generar PDF consolidado

**Resultado Esperado**:
- PDF consolidado generado: `TEST123_BO-0001.pdf`
- Archivo contiene 3 secciones en orden: orden + remisión + informe
- URL guardada en Firestore `consolidado_url`
- Estado `informe_status: "consolidado"`
- Archivo descargable desde el enlace

### Caso de Prueba 2: Orden No Adjunta

**Escenario**: Usuario no sube orden PDF pero genera consolidado
**Pasos**:
1. Crear remisión completa pero sin subir orden PDF
2. Subir solo remisión escaneada
3. Crear informe técnico
4. Generar PDF consolidado

**Resultado Esperado**:
- PDF incluye página "ORDEN NO ADJUNTA - datos" con resumen
- Contiene remisión e informe normalmente  
- Página de orden muestra datos de la remisión como respaldo

### Caso de Prueba 3: Validaciones

**Escenario**: Usuario intenta operaciones sin completar requisitos
**Pasos**:
1. Intentar subir adjuntos sin guardar remisión → Error
2. Intentar crear informe sin guardar remisión → Error
3. Intentar generar consolidado sin orden/móvil → Error
4. Crear informe sin fotos → Error de validación

**Resultado Esperado**:
- Mensajes de error claros y específicos
- Operaciones bloqueadas hasta cumplir requisitos
- UI indica visualmente los estados (botones deshabilitados, etc.)

## Limitaciones y Consideraciones

### Técnicas
- **Tamaño de archivo**: Máximo 10MB por PDF, 5MB por imagen
- **Tipos soportados**: PDF para órdenes, PDF/JPG/PNG/WEBP para remisiones e imágenes
- **Navegadores**: Requiere navegadores modernos con soporte para pdf-lib

### Funcionales  
- **Un informe por remisión**: Solo se mantiene el informe más reciente
- **Re-generación**: El PDF consolidado se puede regenerar pero sobrescribe el anterior
- **Dependencia de conectividad**: Requiere conexión para subir/descargar archivos

### Rendimiento
- **PDFs grandes**: La combinación de múltiples PDFs puede tomar tiempo
- **Muchas fotos**: Gran cantidad de imágenes afecta el tiempo de generación
- **Memoria**: PDFs muy grandes pueden usar mucha memoria del navegador

## Troubleshooting

### Problemas Comunes

**Error: "pdf-lib not found"**
```bash
npm install pdf-lib --legacy-peer-deps
```

**Error: "Cannot upload file"**
- Verificar reglas de Firebase Storage
- Comprobar autenticación del usuario
- Verificar tamaño y tipo de archivo

**Error: "Failed to generate PDF"**
- Verificar conectividad a Firebase
- Comprobar que las URLs de adjuntos son accesibles
- Revisar consola del navegador para errores específicos

**PDF consolidado incompleto**
- Verificar que todos los adjuntos estén subidos correctamente
- Comprobar que el informe tenga fotos y descripción
- Revisar logs de la consola durante la generación

### Logs y Debugging

El módulo incluye logging detallado:
- `🔄` Inicio de procesos
- `✅` Operaciones exitosas  
- `❌` Errores con detalles
- `📤` Subidas a Storage
- `📄` Generación de PDFs

Activar logs en consola del navegador para debugging completo.

## Changelog

### v1.0.0 (Septiembre 2025)
- ✅ Módulo independiente creado
- ✅ Interfaz hoja de cálculo implementada
- ✅ Sistema de adjuntos funcional
- ✅ Modal de informe técnico completado
- ✅ Generación de PDF consolidado operativa
- ✅ Hooks personalizados para gestión de datos
- ✅ Estilos y UX optimizados
- ✅ Documentación completa

### Próximas Mejoras
- [ ] Versionado de PDFs consolidados
- [ ] Compresión automática de imágenes
- [ ] Plantillas personalizables para informes
- [ ] Exportación masiva de consolidados
- [ ] Integración con sistemas externos

---

**Desarrollado por**: Global Mobility Solutions  
**Versión**: 1.0.0  
**Fecha**: Septiembre 2025  
**Tecnologías**: React, Firebase, pdf-lib, Framer Motion