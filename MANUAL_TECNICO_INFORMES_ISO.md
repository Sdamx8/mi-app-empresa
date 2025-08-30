# 📋 MANUAL TÉCNICO - MÓDULO INFORMES TÉCNICOS ISO
## Global Mobility Solutions GMS SAS

### **INFORMACIÓN CORPORATIVA**
- **Razón Social:** Global Mobility Solutions GMS SAS
- **NIT:** 901876981-4
- **Dirección:** Calle 65 Sur No 79C 27, Bogotá – Bosa Centro
- **Teléfono:** (+57) 3114861431
- **Email:** globalmobilitysolutions8@gmail.com

---

## **1. CUMPLIMIENTO NORMATIVO ISO**

### **Estándares Aplicados:**
- ✅ **ISO 9001:2015** - Sistemas de gestión de la calidad
- ✅ **ISO/IEC 27001** - Sistemas de gestión de seguridad de la información
- ✅ **ISO 14001** - Sistemas de gestión ambiental

### **Estructura del Informe Técnico:**
- **ID Formato:** `IT-{remision}-{fecha_remision}` (Ejemplo: IT-1530-20250508)
- **Código de Control:** Generado automáticamente según normativa interna
- **Trazabilidad:** Completa desde remisión hasta informe final

---

## **2. ARQUITECTURA TÉCNICA**

### **Tecnologías Implementadas:**
- **Frontend:** React 19.1.0
- **Backend:** Firebase v12 (Firestore + Storage + Auth)
- **Generación PDF:** jsPDF con cumplimiento ISO
- **Gestión Imágenes:** Firebase Storage con CORS resuelto

### **Servicios Principales:**
1. **`informesTecnicosService.js`** - Gestión de informes con normativa ISO
2. **`imageService.js`** - Manejo de evidencias fotográficas sin CORS
3. **`pdfService.js`** - Generación de documentos técnicos normativos

---

## **3. SOLUCIÓN DEFINITIVA CORS**

### **Problema Identificado:**
```
Access to fetch at 'https://firebasestorage.googleapis.com/...'
from origin 'https://global-flow-db.web.app'
has been blocked by CORS policy
```

### **Solución Implementada:**

#### **A) Configuración CORS Firebase Storage:**
```json
{
  "origin": [
    "http://localhost:3000", 
    "http://localhost:3001", 
    "http://localhost:3002",
    "https://global-flow-db.firebaseapp.com",
    "https://global-flow-db.web.app"
  ],
  "method": ["GET", "POST", "HEAD", "OPTIONS"],
  "responseHeader": [
    "Content-Type", 
    "Authorization", 
    "x-goog-meta-*",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Credentials"
  ],
  "maxAgeSeconds": 3600
}
```

#### **B) Método de Autenticación Mejorado:**
```javascript
// Método 1: Autenticación Firebase
const token = await user.getIdToken();
const response = await fetch(downloadURL, {
  headers: { 'Authorization': `Bearer ${token}` },
  mode: 'cors',
  credentials: 'include'
});

// Método 2: Fetch directo con CORS configurado
const response = await fetch(downloadURL, {
  method: 'GET',
  mode: 'cors',
  headers: { 'Accept': 'image/*' }
});
```

#### **C) Placeholders ISO Compliant:**
En caso de fallo en carga de imágenes, se generan placeholders que mantienen:
- ✅ Identificación corporativa (Logo GMS)
- ✅ Información de contacto completa
- ✅ Código de control interno
- ✅ Cumplimiento normativo declarado

---

## **4. ESTRUCTURA DEL INFORME TÉCNICO**

### **Encabezado Fijo:**
```
Global Mobility Solutions GMS SAS
INFORME TÉCNICO DE SERVICIOS
Calle 65 Sur No 79C 27 Bogotá – Bosa Centro
NIT: 901876981-4 | Tel: (+57) 3114861431
Email: globalmobilitysolutions8@gmail.com
```

### **Información del Informe:**
- **ID Informe:** IT-{remisión}-{fecha_remisión}
- **Fecha de elaboración:** Automática
- **Elaborado por:** Usuario autenticado
- **Código de control interno:** Generado automáticamente

### **Datos de la Remisión:**
- Número de la Remisión
- Número del Móvil (con formateo automático Z70-)
- Título del trabajo
- Técnico asignado
- Fecha de Remisión
- Autorizado por
- UNE

### **Resumen Financiero del Servicio:**
- Subtotal
- Total (incluyendo IVA cuando aplique)

### **Evidencia Fotográfica:**
- Imágenes antes del servicio
- Imágenes después del servicio
- Soporte para múltiples imágenes
- Placeholders ISO en caso de error

### **Pie de Página ISO:**
- Fecha de generación
- Elaborado por
- Numeración de páginas
- Código de control interno
- Información corporativa completa

---

## **5. COMANDOS DE APLICACIÓN CORS**

### **Para Windows:**
```batch
# Ejecutar el archivo:
aplicar-cors.bat
```

### **Para Linux/Mac:**
```bash
# Dar permisos:
chmod +x aplicar-cors.sh

# Ejecutar:
./aplicar-cors.sh
```

### **Manual:**
```bash
# 1. Autenticarse
gcloud auth login

# 2. Configurar proyecto
gcloud config set project global-flow-db

# 3. Aplicar CORS
gsutil cors set cors.json gs://global-flow-db.firebasestorage.app

# 4. Verificar
gsutil cors get gs://global-flow-db.firebasestorage.app
```

---

## **6. TESTING Y VERIFICACIÓN**

### **Proceso de Verificación:**
1. ✅ Acceder al módulo "Informes Técnicos"
2. ✅ Crear nuevo informe con número de remisión
3. ✅ Cargar imágenes antes y después
4. ✅ Completar observaciones técnicas
5. ✅ Generar PDF y verificar carga de imágenes
6. ✅ Confirmar cumplimiento normativo en el documento

### **Indicadores de Éxito:**
- ✅ PDF se genera sin errores CORS
- ✅ Imágenes se cargan correctamente
- ✅ Formato cumple normativa ISO
- ✅ Información corporativa completa
- ✅ Trazabilidad mantenida

---

## **7. SOPORTE TÉCNICO**

### **Contacto Técnico:**
- **Repositorio:** https://github.com/Sdamx8/mi-app-empresa
- **Documentación:** Disponible en el repositorio
- **Logs:** Consola del navegador con prefijo [ISO]

### **Códigos de Error Comunes:**
- **CORS-001:** Error de política de origen cruzado (Aplicar configuración CORS)
- **IMG-002:** Imagen no disponible (Se genera placeholder automático)
- **AUTH-003:** Token de autenticación expirado (Reautenticarse)

---

**Documento generado conforme a normatividad ISO 9001:2015**
**© 2025 Global Mobility Solutions GMS SAS**
