// FIREBASE STORAGE CONFIGURATION
// Este archivo contiene las configuraciones necesarias para Firebase Storage

/**
 * REGLAS DE SEGURIDAD PARA FIREBASE STORAGE
 * 
 * Para resolver los problemas de CORS y permisos, configurar estas reglas en:
 * Firebase Console > Storage > Rules
 */

const STORAGE_RULES = `
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
    
    // Regla general para otros archivos
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
`;

/**
 * CONFIGURACIÓN CORS PARA FIREBASE STORAGE
 * 
 * Para configurar CORS, crear un archivo cors.json con:
 */

const CORS_CONFIG = `
[
  {
    "origin": ["http://localhost:3000", "http://localhost:3001", "https://tu-dominio.com"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "X-Requested-With"]
  }
]
`;

/**
 * COMANDOS PARA APLICAR CONFIGURACIÓN CORS:
 * 
 * 1. Instalar Google Cloud SDK
 * 2. Ejecutar: gcloud auth login
 * 3. Crear cors.json con el contenido de arriba
 * 4. Ejecutar: gsutil cors set cors.json gs://global-flow-db.firebasestorage.app
 */

console.log('📋 Configuraciones de Firebase Storage disponibles:');
console.log('🔐 Reglas de seguridad:', STORAGE_RULES);
console.log('🌐 Configuración CORS:', CORS_CONFIG);

export { STORAGE_RULES, CORS_CONFIG };
