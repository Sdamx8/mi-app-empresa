# 🔧 SOLUCIÓN ALTERNATIVA: REGLAS DE STORAGE MÁS PERMISIVAS

## Si no encuentras configuración CORS en Firebase Console:

### PASO 1: Ve a Firebase Console > Storage > Rules

### PASO 2: Reemplaza las reglas actuales con estas MÁS PERMISIVAS:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir lectura y escritura para todos (TEMPORAL - solo para desarrollo)
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### PASO 3: Hacer clic en "Publicar"

## ⚠️ IMPORTANTE:
- Estas reglas son MUY PERMISIVAS (permiten acceso a cualquiera)
- Solo para DESARROLLO/PRUEBAS
- Cambiar después por reglas más seguras

## ✅ RESULTADO:
- Firebase Storage funcionará sin problemas de CORS
- Tu aplicación podrá subir imágenes directamente
- No más errores de permisos

## 🔒 DESPUÉS, cambiar por reglas más seguras:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /informesTecnicos/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
