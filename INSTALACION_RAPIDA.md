# 🚀 Instalación Rápida - Módulo Informes Técnicos

## ✅ Verificar Dependencias

Tu proyecto ya tiene todas las dependencias necesarias instaladas. Si necesitas reinstalar alguna:

```bash
npm install firebase framer-motion pdfmake lucide-react
```

## ⚙️ Configuración Requerida

### 1. Firebase Configuration

Actualiza `src/services/firebase.js` con tu configuración real:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCxxxxxxxxxxxxxxxxxx",
  authDomain: "tu-proyecto.firebaseapp.com", 
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxxxxxxxxxx"
};
```

### 2. Logo Corporativo (Opcional)

```bash
# Crear carpeta si no existe
mkdir -p public/images

# Coloca tu logo como logo-gms.png en public/images/
# Dimensiones recomendadas: 200x150px o proporcional
```

### 3. Verificar Estructura Firebase

**Firestore Collections:**
- ✅ `remisiones` (debe existir con datos)
- ✅ `EMPLEADOS` (debe tener campo `tipo_empleado`)
- ⚠️ `informesTecnicos` (se crea automáticamente)

**Storage:**
- ✅ Permisos para escribir en `informesTecnicos/`

## 🔗 Integrar al Dashboard

### Opción 1: Agregar al Dashboard Existente

En tu `Dashboard.js`, agrega la navegación:

```javascript
import { InformesTecnicosPage } from './components/InformesTecnicos';

// En tu función de navegación o estado
const [currentPage, setCurrentPage] = useState('dashboard');

// En el render
{currentPage === 'informes-tecnicos' && <InformesTecnicosPage />}

// En tu menú lateral, agrega:
<button onClick={() => setCurrentPage('informes-tecnicos')}>
  📄 Informes Técnicos
</button>
```

### Opción 2: Router React (si lo usas)

```javascript
// En tu App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { InformesTecnicosPage } from './components/InformesTecnicos';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/informes-tecnicos" element={<InformesTecnicosPage />} />
        {/* tus otras rutas */}
      </Routes>
    </Router>
  );
}
```

## 🧪 Prueba Rápida

### 1. Crear Usuario de Prueba

En Firestore, crear documento en `EMPLEADOS`:

```javascript
// Documento ID: [UID del usuario actual]
{
  tipo_empleado: "Administrativo",
  // otros campos...
}
```

### 2. Crear Remisión de Prueba

En Firestore, crear documento en `remisiones`:

```javascript
{
  remision: "TEST-001",
  movil: "Z70-123",
  descripcion: "Prueba de sistema",
  tecnico: "Juan Pérez",
  fecha_remision: "21/08/2025",
  autorizo: "María García",
  une: "TEST",
  subtotal: 100000,
  total: 119000
}
```

### 3. Verificar Funcionamiento

1. ✅ Acceso al módulo (sin error de permisos)
2. ✅ Búsqueda encuentra la remisión de prueba
3. ✅ Autocompletado funciona correctamente
4. ✅ Subida de imágenes funciona
5. ✅ Generación de PDF funciona

## 🔧 Solución de Problemas Comunes

### Error: "Firebase app not initialized"
```bash
# Verificar que firebase.js tenga la config correcta
```

### Error: "Permission denied"
```javascript
// Firestore Rules mínimas requeridas:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /informesTecnicos/{document} {
      allow read, write: if request.auth != null;
    }
    match /remisiones/{document} {
      allow read: if request.auth != null;
    }
    match /EMPLEADOS/{document} {
      allow read: if request.auth != null;
    }
  }
}

// Storage Rules:
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /informesTecnicos/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Imágenes no se muestran en PDF
```bash
# Verificar CORS en el navegador
# Las imágenes de Storage deben permitir crossOrigin
```

### Componente no se renderiza
```javascript
// Verificar importación:
import { InformesTecnicosPage } from './components/InformesTecnicos';

// No:
import InformesTecnicosPage from './components/InformesTecnicos/InformesTecnicosPage';
```

## ✅ Checklist de Instalación Completa

- [ ] Dependencias instaladas
- [ ] Firebase configurado
- [ ] Logo agregado (opcional)
- [ ] Estructura Firestore verificada
- [ ] Reglas de seguridad configuradas
- [ ] Integrado al Dashboard/Router
- [ ] Usuario de prueba creado
- [ ] Remisión de prueba creada
- [ ] Funcionamiento verificado

## 📞 ¿Necesitas Ayuda?

Si encuentras problemas:

1. 🔍 Revisa la consola del navegador para errores
2. 📖 Consulta el archivo `INFORMES_TECNICOS_README.md` completo
3. 🔧 Verifica la configuración de Firebase
4. 🧪 Prueba con datos de ejemplo
5. 💬 Contacta al equipo de desarrollo

---

**¡Listo! El módulo de Informes Técnicos está instalado y funcionando.**
