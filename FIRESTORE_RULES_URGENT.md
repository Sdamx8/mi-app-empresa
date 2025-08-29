# 🚨 SOLUCIÓN URGENTE: ERRORES DE PERMISOS EN FIRESTORE

## ❌ Errores Actuales
```
Error fetching empleado: FirebaseError: Missing or insufficient permissions.
Error al obtener empleados: FirebaseError: Missing or insufficient permissions.
Error al obtener estadísticas del técnico: FirebaseError: Missing or insufficient permissions.
```

## ✅ SOLUCIÓN INMEDIATA - Configurar Reglas de Firestore

### MÉTODO 1: Firebase Console (Recomendado)

1. **Ve a Firebase Console**: https://console.firebase.google.com/
2. **Selecciona tu proyecto**: `global-flow-db`
3. **Ve a Firestore Database → Rules**
4. **Reemplaza las reglas actuales con estas**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reglas para empleados
    match /empleados/{empleadoId} {
      allow read, write: if request.auth != null;
    }
    
    // Reglas para informes técnicos
    match /informesTecnicos/{informeId} {
      allow read, write: if request.auth != null;
    }
    
    // Reglas para historial de trabajos
    match /historialTrabajos/{trabajoId} {
      allow read, write: if request.auth != null;
    }
    
    // Reglas para estadísticas de técnicos
    match /technicianStats/{statId} {
      allow read, write: if request.auth != null;
    }
    
    // Reglas para cualquier otra colección
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. **Haz clic en "Publicar"**

### MÉTODO 2: Firebase CLI (Si tienes Firebase CLI)

```bash
# Autenticar con Firebase
firebase login

# Desplegar reglas
firebase deploy --only firestore:rules
```

## 🎯 VERIFICAR QUE FUNCIONA

1. **Reinicia tu aplicación** (Ctrl+C y npm start)
2. **Ve a cualquier sección** (Empleados, Informes Técnicos)
3. **Los errores de permisos deben desaparecer**

## 📋 ARCHIVOS CREADOS

He creado estos archivos en tu proyecto:
- ✅ `firestore.rules` - Reglas de seguridad
- ✅ `firestore.indexes.json` - Configuración de índices
- ✅ `firebase.json` actualizado

## ⚡ DESPUÉS DE CONFIGURAR

Una vez publiques las reglas en Firebase Console:
1. **Todos los errores de permisos se resolverán**
2. **Tu aplicación funcionará completamente**
3. **Podrás acceder a empleados, informes, estadísticas**

## 🔧 SI PERSISTEN LOS ERRORES

Si después de configurar las reglas sigues viendo errores:
1. **Verifica que el usuario esté autenticado**
2. **Revisa la consola del navegador**
3. **Comprueba que las reglas se desplegaron correctamente**

¡Configura las reglas ahora en Firebase Console para resolver todos los errores!
