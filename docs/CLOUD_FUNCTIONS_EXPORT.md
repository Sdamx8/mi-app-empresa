# Cloud Functions - Exportación de Remisiones

## Descripción

La Cloud Function `exportRemisiones` permite exportar datos de remisiones a Excel o PDF con filtros personalizados y autenticación basada en roles.

## Configuración

### 1. Estructura de archivos

```
functions/
├── exportRemisiones/
│   ├── package.json
│   ├── index.js
│   └── .env (opcional)
```

### 2. Configuración de Firebase

El archivo `firebase.json` debe incluir:

```json
{
  "functions": {
    "source": "functions/exportRemisiones",
    "runtime": "nodejs18",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ]
  }
}
```

### 3. Variables de entorno

Configurar en Firebase Functions:

```bash
# Configurar bucket de Storage para exportaciones
firebase functions:config:set storage.bucket="mi-app-empresa-exports"

# Ver configuración actual
firebase functions:config:get
```

## Despliegue

### Despliegue completo

```bash
# Instalar dependencias en la función
cd functions/exportRemisiones
npm install

# Volver a la raíz del proyecto
cd ../..

# Desplegar la función
firebase deploy --only functions:exportRemisiones
```

### Despliegue solo para desarrollo

```bash
# Ejecutar emulators localmente
firebase emulators:start --only functions,firestore,auth

# En otra terminal, probar la función
node scripts/test_export_function.js
```

## Uso de la API

### Endpoint

```
POST https://us-central1-{PROJECT_ID}.cloudfunctions.net/exportRemisiones
```

### Headers requeridos

```http
Content-Type: application/json
Authorization: Bearer {FIREBASE_ID_TOKEN}
```

### Cuerpo de la petición

```json
{
  "filtros": {
    "fechaInicio": "2024-01-01",
    "fechaFin": "2024-12-31",
    "estado": "pendiente",
    "movil": "001",
    "tecnico": "Juan Pérez",
    "remision": 1064
  },
  "tipo": "excel",
  "incluirHistorial": false
}
```

### Respuesta exitosa

```json
{
  "success": true,
  "downloadUrl": "https://storage.googleapis.com/bucket/exports/remisiones_2024-01-15.xlsx",
  "filename": "remisiones_2024-01-15.xlsx",
  "totalRecords": 156,
  "appliedFilters": {
    "estado": "pendiente",
    "fechaInicio": "2024-01-01T00:00:00.000Z"
  },
  "generatedBy": "admin@empresa.com",
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "expiresAt": "2024-01-16T10:30:00.000Z"
}
```

### Respuesta de error

```json
{
  "error": "Rol de usuario no autorizado para exportar",
  "details": "Usuario debe tener rol: tecnico, administrativo o directivo"
}
```

## Ejemplos de integración

### JavaScript/React

```javascript
// services/exportService.js
import { auth } from '../firebase/config';

export const exportRemisiones = async (filtros, tipo = 'excel') => {
  try {
    // Obtener token del usuario actual
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    
    const token = await user.getIdToken();
    
    const response = await fetch(
      'https://us-central1-mi-app-empresa.cloudfunctions.net/exportRemisiones',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          filtros,
          tipo,
          incluirHistorial: false
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al exportar');
    }
    
    const result = await response.json();
    
    // Descargar archivo automáticamente
    const link = document.createElement('a');
    link.href = result.downloadUrl;
    link.download = result.filename;
    link.click();
    
    return result;
    
  } catch (error) {
    console.error('Error exportando:', error);
    throw error;
  }
};

// Uso en componente
const handleExport = async () => {
  try {
    setLoading(true);
    
    const filtros = {
      fechaInicio: '2024-01-01',
      fechaFin: '2024-12-31',
      estado: 'pendiente'
    };
    
    const result = await exportRemisiones(filtros, 'excel');
    
    // Mostrar notificación de éxito
    showNotification(`Archivo exportado: ${result.filename}`);
    
  } catch (error) {
    showError(`Error al exportar: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

### cURL

```bash
# Obtener token primero (desde la aplicación web o herramientas de Firebase)
TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

# Exportar con filtros
curl -X POST \
  "https://us-central1-mi-app-empresa.cloudfunctions.net/exportRemisiones" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "filtros": {
      "estado": "pendiente",
      "fechaInicio": "2024-01-01"
    },
    "tipo": "excel"
  }'
```

## Seguridad

### Autenticación

- Requiere Firebase ID token válido
- Token debe contener custom claim `role`
- Roles válidos: `tecnico`, `administrativo`, `directivo`

### Autorización por rol

| Rol | Permisos |
|-----|----------|
| `tecnico` | ✅ Exportar remisiones básicas |
| `administrativo` | ✅ Exportar con todos los filtros |
| `directivo` | ✅ Exportar con historial completo |

### Configuración de custom claims

```javascript
// En Admin SDK o Cloud Function de admin
await admin.auth().setCustomUserClaims(uid, {
  role: 'administrativo'
});
```

## Filtros disponibles

| Filtro | Tipo | Descripción | Ejemplo |
|--------|------|-------------|---------|
| `fechaInicio` | string/Date | Fecha de inicio (ISO) | "2024-01-01" |
| `fechaFin` | string/Date | Fecha de fin (ISO) | "2024-12-31" |
| `estado` | string | Estado de la remisión | "pendiente" |
| `movil` | string | Código del móvil | "001" |
| `tecnico` | string | Nombre del técnico | "Juan Pérez" |
| `remision` | number | Número de remisión | 1064 |

## Tipos de exportación

### Excel (.xlsx)
- ✅ **Implementado**
- Formato: Microsoft Excel 2007+
- Columnas configurables
- Datos formateados con moneda colombiana
- Ancho de columnas optimizado

### PDF (.pdf)
- ⚠️ **En desarrollo**
- Formato: Adobe PDF
- Tabla responsiva
- Encabezados y filtros aplicados
- Pie de página con totales

## Monitoreo y logs

### Logs en Firebase Console

```bash
# Ver logs en tiempo real
firebase functions:log --only exportRemisiones

# Ver logs específicos
firebase functions:log --only exportRemisiones --lines 50
```

### Métricas importantes

- **Invocaciones**: Número de exportaciones realizadas
- **Errores**: Fallos de autenticación y procesamiento
- **Duración**: Tiempo de generación por archivo
- **Memoria**: Uso de memoria por exportación

### Alertas recomendadas

1. **Error rate > 5%**: Problemas de autenticación o datos
2. **Duración > 30s**: Consultas lentas o archivos grandes
3. **Memoria > 80%**: Optimizar procesamiento de datos

## Limitaciones

### Tamaño de datos
- **Máximo recomendado**: 10,000 remisiones por exportación
- **Timeout**: 540 segundos (9 minutos)
- **Memoria**: 2GB en Cloud Functions

### Frecuencia de uso
- **Rate limiting**: 100 solicitudes/minuto por usuario
- **Concurrencia**: 10 exportaciones simultáneas

### Storage
- **Retención**: URLs firmadas válidas por 24 horas
- **Limpieza**: Archivos eliminados automáticamente después de 7 días

## Solución de problemas

### Error 401: "Token de autorización requerido"
- Verificar que se envía header `Authorization: Bearer {token}`
- Validar que el token no haya expirado
- Renovar token con `user.getIdToken(true)`

### Error 401: "Rol de usuario no autorizado"
- Verificar custom claims del usuario
- Configurar rol válido: `tecnico`, `administrativo`, `directivo`

### Error 404: "No se encontraron remisiones"
- Verificar filtros aplicados
- Validar que existen datos en Firestore
- Revisar permisos de lectura en reglas de Firestore

### Error 500: "Error interno del servidor"
- Revisar logs de la función: `firebase functions:log`
- Verificar configuración de Storage bucket
- Validar formato de datos en Firestore

### Error de timeout
- Reducir rango de fechas en filtros
- Exportar en lotes más pequeños
- Verificar índices de Firestore para consultas

## Desarrollo local

### Configuración del emulator

```bash
# Iniciar emulators
firebase emulators:start --only functions,firestore,auth

# Poblar datos de prueba
node scripts/populate_test_data.js

# Probar función
node scripts/test_export_function.js
```

### Variables de entorno locales

Crear `.env` en `functions/exportRemisiones/`:

```env
FIREBASE_CONFIG={"projectId":"demo-project"}
GCLOUD_PROJECT=demo-project
STORAGE_BUCKET=demo-project-exports
```

## Próximas mejoras

- [ ] Exportación PDF completa
- [ ] Incluir historial en exportaciones
- [ ] Compresión ZIP para archivos grandes
- [ ] Notificaciones por email con enlace de descarga
- [ ] Programación de exportaciones automáticas
- [ ] Dashboard de métricas de exportación
- [ ] Exportación a otros formatos (CSV, JSON)

---

**Documentación generada para el módulo de exportación de remisiones**
*Última actualización: Enero 2024*
