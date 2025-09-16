// scripts/migrarDatos.js - Script para migrar datos existentes agregando userId
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCnyqtyRy0vHoyUnv4fpQVD5VDZ4W3UyE4',
  authDomain: 'global-flow-db.firebaseapp.com',
  projectId: 'global-flow-db',
  storageBucket: 'global-flow-db.firebasestorage.app',
  messagingSenderId: '232714971434',
  appId: '1:232714971434:web:25650510cebd7fb8b39653',
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Script para migrar documentos existentes agregando userId
 * IMPORTANTE: Este script debe ejecutarse una sola vez por cada usuario
 * Y solo después de que el usuario se haya autenticado
 */

export async function migrarDocumentosUsuario() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ Usuario no autenticado. Inicie sesión primero.');
      return false;
    }

    console.log(`🔄 Iniciando migración de datos para usuario: ${currentUser.uid}`);
    
    // Colecciones a migrar
    const colecciones = [
      'empleados',
      'historialTrabajos',
      'technicianStats'
    ];

    let totalMigrados = 0;

    for (const coleccionNombre of colecciones) {
      console.log(`\n📂 Migrando colección: ${coleccionNombre}`);
      
      try {
        const coleccionRef = collection(db, coleccionNombre);
        const snapshot = await getDocs(coleccionRef);
        
        let migradosEnColeccion = 0;

        for (const documento of snapshot.docs) {
          const data = documento.data();
          
          // Solo migrar documentos que NO tengan userId
          if (!data.userId) {
            try {
              await updateDoc(doc(db, coleccionNombre, documento.id), {
                userId: currentUser.uid
              });
              
              migradosEnColeccion++;
              totalMigrados++;
              
              console.log(`✅ Migrado: ${documento.id}`);
            } catch (updateError) {
              console.error(`❌ Error migrando ${documento.id}:`, updateError);
            }
          } else {
            console.log(`⏭️ Ya tiene userId: ${documento.id}`);
          }
        }
        
        console.log(`📊 ${coleccionNombre}: ${migradosEnColeccion} documentos migrados`);
        
      } catch (coleccionError) {
        console.error(`❌ Error en colección ${coleccionNombre}:`, coleccionError);
      }
    }

    console.log(`\n🎉 Migración completada. Total documentos migrados: ${totalMigrados}`);
    return true;

  } catch (error) {
    console.error('❌ Error en migración:', error);
    return false;
  }
}

/**
 * Script de verificación para comprobar el estado de la migración
 */
export async function verificarMigracion() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ Usuario no autenticado');
      return;
    }

    console.log(`🔍 Verificando migración para usuario: ${currentUser.uid}`);

    const colecciones = ['empleados', 'historialTrabajos', 'technicianStats'];
    
    for (const coleccionNombre of colecciones) {
      const coleccionRef = collection(db, coleccionNombre);
      const snapshot = await getDocs(coleccionRef);
      
      let conUserId = 0;
      let sinUserId = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) {
          conUserId++;
        } else {
          sinUserId++;
        }
      });

      console.log(`📂 ${coleccionNombre}: ${conUserId} con userId, ${sinUserId} sin userId`);
    }

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

// Función para uso en la consola del navegador
window.migrarDatos = migrarDocumentosUsuario;
window.verificarMigracion = verificarMigracion;

console.log(`
🔧 SCRIPTS DE MIGRACIÓN DISPONIBLES:

1. migrarDatos() - Migra documentos existentes agregando userId
2. verificarMigracion() - Verifica el estado de la migración

⚠️  IMPORTANTE: 
- El usuario debe estar autenticado antes de ejecutar
- Solo ejecutar migrarDatos() una vez por usuario
- Verificar con verificarMigracion() antes y después
`);
