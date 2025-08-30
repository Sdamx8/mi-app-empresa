# Módulo Informes Técnicos - Global Mobility Solutions

## Descripción

El módulo **Informes Técnicos** es una solución completa para la gestión de reportes técnicos de servicios automotrices. Permite crear informes basados en remisiones existentes, gestionar evidencia fotográfica categorizada (ANTES/DESPUÉS) y generar documentos PDF profesionales.

## 🚀 Características Principales

- ✅ **Búsqueda y autocompletado** desde remisiones en Firestore
- ✅ **Gestión de evidencia fotográfica** separada en categorías ANTES/DESPUÉS
- ✅ **Generación de PDF** con formato profesional carta vertical
- ✅ **Control de acceso por roles** (Administrativo/Directivo)
- ✅ **CRUD completo** con búsqueda y paginación
- ✅ **Animaciones suaves** con Framer Motion
- ✅ **Diseño responsive** con Tailwind CSS
- ✅ **Normalización automática** de datos de móviles
- ✅ **Eliminación segura** de documentos e imágenes

## 📋 Requisitos Previos

### Dependencias de Node.js

Todas las dependencias ya están instaladas en tu proyecto. Verifica que tienes:

```json
{
  "firebase": "^12.0.0",
  "framer-motion": "^12.23.12",
  "pdfmake": "^0.2.20",
  "lucide-react": "^0.540.0",
  "react": "^19.1.0",
  "react-dom": "^19.1.0"
}
```

### Configuración de Firebase

Asegúrate de tener configurado:

1. **Firestore** con las colecciones:
   - `remisiones` (con campos: remision, movil, descripcion, tecnico, fecha_remision, autorizo, une, subtotal, total)
   - `informesTecnicos` (se crea automáticamente)
   - `EMPLEADOS` (con campo: tipo_empleado)

2. **Storage** con permisos para crear carpetas bajo `informesTecnicos/`

3. **Authentication** funcionando en tu aplicación

## 🏗️ Estructura de Archivos

```
src/
├── components/InformesTecnicos/
│   ├── InformesTecnicosPage.jsx      # Página principal del módulo
│   ├── InformeForm.jsx               # Formulario de creación/edición
│   ├── InformesTable.jsx             # Tabla con CRUD y búsqueda
│   ├── BuscarRemisionForm.jsx        # Búsqueda y autocompletado
│   ├── UploaderAntes.jsx             # Carga de imágenes ANTES
│   ├── UploaderDespues.jsx           # Carga de imágenes DESPUÉS
│   ├── RoleGuard.jsx                 # Control de acceso por roles
│   └── index.js                      # Exportaciones del módulo
├── services/
│   ├── firebase.js                   # Configuración de Firebase
│   ├── firestore.js                  # Servicios de Firestore
│   ├── storage.js                    # Servicios de Storage
│   └── pdf.js                        # Generación de PDF
└── public/
    └── images/
        └── logo-gms.png              # Logo corporativo (opcional)
```

## 🔧 Instalación y Configuración

### 1. Verificar Dependencias Adicionales

Si necesitas instalar dependencias faltantes:

```bash
# Verificar si faltan dependencias
npm install firebase framer-motion pdfmake lucide-react

# Si usas TypeScript, también:
npm install --save-dev @types/pdfmake
```

### 2. Configuración de Firebase

En `src/services/firebase.js`, asegúrate de tener tu configuración:

```javascript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};
```

### 3. Agregar el Logo Corporativo

Coloca el archivo `logo-gms.png` en `public/images/logo-gms.png` para que aparezca en los PDFs.

### 4. Integrar con tu Aplicación

#### Opción A: Router React

```javascript
// En tu App.js o sistema de rutas
import { InformesTecnicosPage } from './components/InformesTecnicos';

// En tus rutas:
<Route path="/informes-tecnicos" element={<InformesTecnicosPage />} />
```

#### Opción B: Navegación Manual

```javascript
// En tu Dashboard o componente principal
import { InformesTecnicosPage } from './components/InformesTecnicos';

const Dashboard = () => {
  const [paginaActual, setPaginaActual] = useState('dashboard');
  
  if (paginaActual === 'informes-tecnicos') {
    return <InformesTecnicosPage />;
  }
  
  // ... resto de tu dashboard
};
```

## 🎯 Uso del Módulo

### 1. Acceso por Roles

Solo usuarios con `tipo_empleado = "Administrativo"` o `"Directivo"` pueden acceder al módulo.

### 2. Crear Nuevo Informe

1. Hacer clic en "Nuevo Informe"
2. Buscar una remisión existente
3. Los campos se autocompletar automáticamente
4. Agregar observaciones técnicas
5. Subir imágenes ANTES y DESPUÉS (mínimo 1)
6. Guardar el informe

### 3. Gestionar Informes

- **Ver lista:** Tabla paginada con búsqueda
- **Editar:** Clic en el ícono de editar
- **Eliminar:** Confirma y elimina documento + imágenes
- **Exportar PDF:** Clic en el ícono de descarga

### 4. Búsqueda de Informes

Puedes buscar por:
- ID del informe
- Número de remisión
- Móvil
- Nombre del técnico
- Título del trabajo

## 📄 Estructura del PDF

### Encabezado
- Fondo azul corporativo (#0056A6)
- Logo de la empresa (si existe)
- Información de contacto

### Cuerpo
- **Información del informe:** ID, remisión, móvil, técnico, fecha
- **Servicios prestados:** título, autorización, valores
- **Observaciones técnicas:** detalles del trabajo
- **Evidencia fotográfica:** imágenes organizadas en ANTES/DESPUÉS

### Pie
- Estándares ISO 9001:2015
- Numeración de páginas

## 🔒 Reglas de Negocio

### Normalización de Móviles
- Remover prefijo "BO-" si existe
- Si no inicia con "Z70-" y es numérico, anteponer "Z70-"

### Validaciones
- Campos obligatorios: remisión, título, técnico, fecha, total
- Mínimo 1 imagen (ANTES o DESPUÉS)
- Imágenes máximo 5MB, formatos JPG/PNG/WEBP

### Estructura de Datos

```javascript
const informeTecnico = {
  idInforme: "IT-123-21082025",      // Generado automáticamente
  remision: "123",
  movil: "Z70-456",                   // Normalizado
  tituloTrabajo: "Reparación motor",
  tecnico: "Juan Pérez",
  fechaRemision: "21/08/2025",        // Formato DD/MM/AAAA
  autorizo: "María García",
  une: "ABC123",
  subtotal: 100000,
  total: 119000,                      // Incluye IVA
  observacionesTecnicas: "...",
  imagenesAntes: [
    { url: "https://...", nombre: "antes1.jpg" }
  ],
  imagenesDespues: [
    { url: "https://...", nombre: "despues1.jpg" }
  ],
  estado: "Generado con éxito",
  creadoEn: Timestamp,
  creadoPor: "uid-usuario"
};
```

## 🛠️ Personalización

### Modificar Estilos
Los componentes usan Tailwind CSS. Puedes modificar las clases en cada componente.

### Cambiar Colores Corporativos
En `src/services/pdf.js`, modifica el color `#0056A6` por el de tu empresa.

### Agregar Campos Personalizados
1. Actualizar la estructura en `InformeForm.jsx`
2. Modificar validaciones en `validarFormulario()`
3. Actualizar el servicio PDF si es necesario

### Personalizar PDF
En `src/services/pdf.js` puedes:
- Cambiar el tamaño de página
- Modificar estilos y colores
- Agregar/quitar secciones
- Personalizar el encabezado/pie

## 🚨 Solución de Problemas

### Error: "Firebase not initialized"
Verifica que `src/services/firebase.js` tenga la configuración correcta.

### Error: "Permission denied"
1. Verifica las reglas de Firestore
2. Confirma que el usuario tenga el rol correcto en `EMPLEADOS`

### Imágenes no se suben
1. Verifica las reglas de Storage
2. Confirma que el usuario esté autenticado
3. Verifica el formato y tamaño de las imágenes

### PDF no se genera
1. Verifica que pdfmake esté instalado
2. Confirma que las imágenes se conviertan a dataURL correctamente
3. Revisa la consola para errores de CORS

### Componente no se renderiza
1. Verifica que todas las importaciones sean correctas
2. Confirma que el usuario tenga permisos
3. Revisa errores en la consola del navegador

## 📞 Soporte

Para reportes de errores o mejoras, contacta al equipo de desarrollo con:
- Descripción del problema
- Pasos para reproducir
- Capturas de pantalla (si aplica)
- Información del navegador y versión

---

**Módulo desarrollado para Global Mobility Solutions GMS SAS**
*Gestión integral de informes técnicos con estándares ISO 9001:2015*
