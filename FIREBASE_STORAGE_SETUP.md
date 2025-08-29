# GUÍA PARA RESOLVER ERRORES DE CORS EN FIREBASE STORAGE

## 🚨 Problema Actual
Tu aplicación está mostrando errores CORS al intentar subir imágenes a Firebase Storage:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:3001' has been blocked by CORS policy
```

## ✅ SOLUCIONES (En orden de preferencia)

### SOLUCIÓN 1: Configurar Reglas de Firebase Storage (Recomendado)

1. **Ve a Firebase Console**: https://console.firebase.google.com/
2. **Selecciona tu proyecto**: `global-flow-db`
3. **Navega a Storage → Rules**
4. **Reemplaza las reglas actuales con estas**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir lectura y escritura para usuarios autenticados
    match /informesTecnicos/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Permitir operaciones de test para diagnóstico
    match /test/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Regla general para otros archivos (opcional)
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. **Haz clic en "Publicar"**

### SOLUCIÓN 2: Configurar CORS (Si Solución 1 no funciona)

1. **Instala Google Cloud SDK**: https://cloud.google.com/sdk/docs/install
2. **Autentica con Google Cloud**:
   ```bash
   gcloud auth login
   ```
3. **Aplica la configuración CORS**:
   ```bash
   gsutil cors set cors.json gs://global-flow-db.firebasestorage.app
   ```

### SOLUCIÓN 3: Temporal - Usar Base64 (Actual)

Por ahora, la aplicación usa imágenes en base64 como solución temporal. Esto funciona pero:
- ❌ Las imágenes no se almacenan permanentemente
- ❌ Los PDFs serán más pesados
- ❌ No se pueden compartir las imágenes

## 🔧 PASOS INMEDIATOS

1. **Configura las reglas de Firebase Storage** (Solución 1)
2. **Reinicia tu aplicación**
3. **Prueba subir una imagen**

## 🧪 VERIFICAR QUE FUNCIONA

1. Abre la consola del navegador
2. Intenta subir una imagen
3. Deberías ver: `✅ Imagen antes/despues subida exitosamente`
4. En lugar de: `❌ Error en uploadBytes`

## 📞 SI NECESITAS AYUDA

- Firebase Console: https://console.firebase.google.com/
- Documentación Storage: https://firebase.google.com/docs/storage/web/start
- Configuración CORS: https://firebase.google.com/docs/storage/web/download-files#cors_configuration

## ⚡ DESPUÉS DE CONFIGURAR

Una vez configurado Firebase Storage, necesitas:

1. **Descomentar el código original en imageService.js**
2. **Comentar la parte de base64 temporal**
3. **Reiniciar la aplicación**

¡El sistema volverá a usar Firebase Storage permanentemente!
