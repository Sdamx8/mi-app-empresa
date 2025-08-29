# Proceso Paso a Paso: Carga de Imágenes Múltiples para Informes Técnicos

## 📋 Descripción General

Este documento describe el proceso interno completo para cargar múltiples imágenes desde el computador hacia los informes técnicos, incluyendo imágenes "antes" y "después" del servicio realizado.

## 🎯 Objetivos

- ✅ Permitir la carga de hasta 5 imágenes por sección (antes/después)
- ✅ Validar formato y tamaño de archivos
- ✅ Proporcionar vista previa inmediata
- ✅ Integrar imágenes en PDFs exportados
- ✅ Mantener compatibilidad con sistema anterior

## 📁 Arquitectura del Sistema

### 1. Estructura de Archivos
```
src/
├── components/
│   ├── MultipleImageUpload.jsx     # Componente UI para carga múltiple
│   └── MultipleImageUpload.css     # Estilos del componente
├── services/
│   ├── imageService.js             # Gestión de imágenes (Firebase Storage)
│   ├── informesTecnicosService.js  # Gestión de informes
│   └── pdfService.js               # Generación de PDFs con múltiples imágenes
└── firestore.rules                 # Reglas de seguridad simplificadas
```

### 2. Base de Datos (Firestore)
```javascript
// Estructura del documento de informe
{
  // Campos únicos (compatibilidad hacia atrás)
  imagenAntesURL: "url_imagen_unica_antes",
  imagenDespuesURL: "url_imagen_unica_despues",
  
  // Campos múltiples (nueva funcionalidad)
  imagenesAntesURLs: ["url1", "url2", "url3"],
  imagenesDespuesURLs: ["url1", "url2", "url3"],
  
  // Metadatos
  elaboradoPor: "usuario@empresa.com",
  trazabilidad: {
    fechaCreacion: "2024-01-15T10:30:00Z",
    ultimaModificacion: "2024-01-15T15:45:00Z",
    version: "2"
  }
}
```

### 3. Almacenamiento (Firebase Storage)
```
storage/
├── informes/
│   └── {email_usuario}/
│       └── {informe_id}/
│           ├── antes/
│           │   ├── imagen_1.jpg
│           │   ├── imagen_2.jpg
│           │   └── imagen_3.jpg
│           └── despues/
│               ├── imagen_1.jpg
│               └── imagen_2.jpg
```

## 🔄 Proceso Paso a Paso

### FASE 1: Selección de Imágenes por el Usuario

#### Paso 1.1: Interfaz de Usuario
```javascript
// El usuario accede al componente MultipleImageUpload
<MultipleImageUpload 
  label="Imágenes ANTES del servicio"
  images={imagenesAntes}
  onImagesChange={setImagenesAntes}
  maxImages={5}
/>
```

#### Paso 1.2: Métodos de Selección
- **Arrastrar y soltar**: Usuario arrastra archivos desde el explorador
- **Clic para seleccionar**: Usuario hace clic y selecciona desde el diálogo de archivos
- **Selección múltiple**: Ctrl/Cmd + clic para seleccionar varios archivos

#### Paso 1.3: Validación Inmediata
```javascript
// Validaciones aplicadas automáticamente
const validaciones = {
  formato: ['image/jpeg', 'image/png', 'image/gif'],
  tamañoMaximo: 5 * 1024 * 1024, // 5MB
  cantidadMaxima: 5,
  nombreArchivo: /^[a-zA-Z0-9._-]+$/
};
```

### FASE 2: Vista Previa y Gestión

#### Paso 2.1: Generación de Vista Previa
```javascript
// Creación automática de URLs temporales para vista previa
images.map(image => ({
  file: image,
  preview: URL.createObjectURL(image),
  name: image.name,
  size: image.size
}));
```

#### Paso 2.2: Gestión de Imágenes
- **Agregar**: Máximo 5 imágenes por sección
- **Eliminar**: Clic en el botón X de cada imagen
- **Reordenar**: Próxima funcionalidad (drag & drop dentro de la vista previa)

### FASE 3: Procesamiento y Subida

#### Paso 3.1: Preparación para Subida
```javascript
// Proceso ejecutado al guardar el informe
const procesarImagenes = async (imagenes, informeId, tipo) => {
  // 1. Validar archivos nuevamente
  imagenes.forEach(img => ImageService.validateImageFile(img));
  
  // 2. Determinar estrategia de subida
  if (imagenes.length === 1) {
    return await ImageService.uploadImage(imagenes[0], informeId, tipo);
  } else {
    return await ImageService.uploadMultipleImages(imagenes, informeId, tipo);
  }
};
```

#### Paso 3.2: Subida a Firebase Storage
```javascript
// Proceso de subida múltiple
static async uploadMultipleImages(images, reportId, type) {
  const uploadPromises = images.map(async (image, index) => {
    const fileName = `${type}_${index + 1}_${Date.now()}.jpg`;
    const filePath = `informes/${auth.currentUser.email}/${reportId}/${type}/${fileName}`;
    
    // Subir archivo
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, image);
    return await getDownloadURL(snapshot.ref);
  });
  
  return await Promise.all(uploadPromises);
}
```

### FASE 4: Almacenamiento en Firestore

#### Paso 4.1: Estrategia de Guardado
```javascript
// Lógica de decisión para compatibilidad
const guardarImagenes = (urls, tipo) => {
  if (urls.length === 1) {
    // Usar campos únicos para compatibilidad
    return {
      [`imagen${tipo}URL`]: urls[0],
      [`imagenes${tipo}URLs`]: null
    };
  } else {
    // Usar campos múltiples
    return {
      [`imagen${tipo}URL`]: null,
      [`imagenes${tipo}URLs`]: urls
    };
  }
};
```

#### Paso 4.2: Actualización del Documento
```javascript
// Actualización en Firestore con metadatos
await updateDoc(doc(db, 'informesTecnicos', informeId), {
  ...datosInforme,
  ...urlsImagenes,
  elaboradoPor: currentUser.email,
  'trazabilidad.ultimaModificacion': new Date().toISOString(),
  'trazabilidad.version': String(parseInt(versionAnterior) + 1)
});
```

### FASE 5: Generación de PDF

#### Paso 5.1: Extracción de Imágenes
```javascript
// Extraer todas las imágenes disponibles
const extraerImagenes = (informeData, imagenes) => {
  const imagenesParaPDF = { antes: [], despues: [] };
  
  // Desde campos únicos
  if (informeData.imagenAntesURL) {
    imagenesParaPDF.antes.push(informeData.imagenAntesURL);
  }
  
  // Desde campos múltiples
  if (informeData.imagenesAntesURLs) {
    imagenesParaPDF.antes.push(...informeData.imagenesAntesURLs);
  }
  
  return imagenesParaPDF;
};
```

#### Paso 5.2: Disposición en PDF
```javascript
// Organización de imágenes en el PDF
const procesarSeccionImagenes = async (pdf, imagenesArray, titulo) => {
  const imagesPerRow = 2;
  const imageWidth = 65;
  const imageHeight = 45;
  
  // Procesar en filas de 2 imágenes
  for (let i = 0; i < imagenesArray.length; i += imagesPerRow) {
    const filasImagenes = imagenesArray.slice(i, i + imagesPerRow);
    
    // Agregar cada imagen de la fila
    filasImagenes.forEach((imagen, j) => {
      const xPos = margin + (j * (imageWidth + spacing));
      pdf.addImage(imagen, 'JPEG', xPos, currentY, imageWidth, imageHeight);
    });
  }
};
```

## 🔒 Seguridad y Validaciones

### 1. Validaciones del Cliente
```javascript
const validaciones = {
  // Formato de archivo
  formatosPermitidos: ['image/jpeg', 'image/png', 'image/gif'],
  
  // Tamaño de archivo
  tamañoMaximo: 5 * 1024 * 1024, // 5MB
  
  // Cantidad máxima
  cantidadMaxima: 5,
  
  // Dimensiones mínimas
  anchoMinimo: 200,
  altoMinimo: 200
};
```

### 2. Reglas de Firestore
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /informesTecnicos/{document} {
      allow read, write: if 
        request.auth != null && 
        request.auth.token.email == resource.data.elaboradoPor;
    }
  }
}
```

### 3. Reglas de Storage
```javascript
// Firebase Storage Security Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /informes/{email}/{reportId}/{allPaths=**} {
      allow read, write: if 
        request.auth != null && 
        request.auth.token.email == email;
    }
  }
}
```

## 📊 Métricas y Monitoreo

### 1. Eventos Rastreados
```javascript
const eventos = {
  'imagen_subida_exitosa': { usuario, informeId, tipo, cantidad },
  'imagen_error_formato': { usuario, archivo, error },
  'imagen_error_tamaño': { usuario, archivo, tamaño },
  'pdf_generado_con_imagenes': { usuario, informeId, totalImagenes }
};
```

### 2. Límites y Cuotas
```javascript
const limites = {
  imagenesPerInforme: 10, // 5 antes + 5 después
  tamañoTotalPerInforme: 50 * 1024 * 1024, // 50MB
  imagenesPerUsuarioMes: 1000,
  almacenamientoPerUsuario: '1GB'
};
```

## 🚀 Flujo de Trabajo Completo

### Escenario: Usuario carga 3 imágenes "antes" y 2 imágenes "después"

1. **Selección**: Usuario arrastra 3 archivos a la sección "antes"
2. **Validación**: Sistema valida formato, tamaño y cantidad
3. **Vista Previa**: Se muestran las 3 imágenes con opción de eliminar
4. **Repetir**: Usuario selecciona 2 archivos para la sección "después"
5. **Guardar Informe**: Usuario hace clic en "Guardar"
6. **Subida Paralela**: Sistema sube las 5 imágenes en paralelo
7. **Almacenamiento**: URLs se guardan en campos múltiples
8. **Confirmación**: Usuario recibe confirmación de éxito
9. **PDF**: Al exportar, el PDF incluye las 5 imágenes organizadas
10. **Descarga**: Usuario descarga PDF con todas las evidencias

## 🔧 Mantenimiento y Actualizaciones

### 1. Migración de Datos Existentes
```javascript
// Script para migrar informes con imagen única a múltiple
const migrarImagenesUnicas = async () => {
  const informes = await getDocs(collection(db, 'informesTecnicos'));
  
  informes.forEach(async (doc) => {
    const data = doc.data();
    const updates = {};
    
    // Migrar imagen antes única
    if (data.imagenAntesURL && !data.imagenesAntesURLs) {
      updates.imagenesAntesURLs = [data.imagenAntesURL];
      updates.imagenAntesURL = null;
    }
    
    if (Object.keys(updates).length > 0) {
      await updateDoc(doc.ref, updates);
    }
  });
};
```

### 2. Optimizaciones Futuras
- **Compresión de imágenes**: Reducir tamaño automáticamente
- **Lazy loading**: Cargar imágenes solo cuando sea necesario  
- **Cache local**: Almacenar imágenes temporalmente
- **Reordenamiento**: Permitir cambiar orden de imágenes
- **Etiquetas**: Agregar descripciones a cada imagen

## 📞 Soporte y Resolución de Problemas

### Problemas Comunes

1. **Error: "Archivo muy grande"**
   - Solución: Redimensionar imagen o usar formato más eficiente
   
2. **Error: "Formato no soportado"**
   - Solución: Convertir a JPG, PNG o GIF
   
3. **Error: "Máximo de imágenes alcanzado"**
   - Solución: Eliminar algunas imágenes antes de agregar nuevas
   
4. **PDF no muestra imágenes**
   - Solución: Verificar URLs de Firebase Storage y permisos

### Logs de Depuración
```javascript
// Habilitar logs detallados
localStorage.setItem('DEBUG_IMAGES', 'true');

// Los logs aparecerán en la consola del navegador
console.log('🖼️ Procesando imagen para PDF:', imageUrl);
console.log('✅ Imagen procesada exitosamente');
console.log('❌ Error procesando imagen:', error);
```

---

**Última actualización**: Enero 2024  
**Versión del documento**: 1.0  
**Responsable**: Equipo de Desarrollo
