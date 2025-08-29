// migrarDatosSimple.js - Script simplificado para migración de datos
// Ejecutar en la consola del navegador después de iniciar sesión

async function migrarDatosUsuario() {
  try {
    // Verificar que Firebase esté disponible
    if (!window.firebase || !window.firebase.auth || !window.firebase.firestore) {
      console.error('❌ Firebase no está disponible. Asegúrate de que la aplicación esté cargada.');
      return;
    }

    const auth = window.firebase.auth();
    const db = window.firebase.firestore();
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ Usuario no autenticado. Por favor, inicia sesión primero.');
      return;
    }

    console.log(`🔄 Iniciando migración para usuario: ${currentUser.uid}`);

    // Colecciones a migrar
    const colecciones = ['empleados', 'informesTecnicos', 'historialTrabajos', 'technicianStats'];
    let totalMigrados = 0;

    for (const coleccion of colecciones) {
      console.log(`\n📂 Procesando: ${coleccion}`);
      
      try {
        const snapshot = await db.collection(coleccion).get();
        let migradosEnColeccion = 0;

        for (const doc of snapshot.docs) {
          const data = doc.data();
          
          if (!data.userId) {
            await doc.ref.update({ userId: currentUser.uid });
            migradosEnColeccion++;
            totalMigrados++;
            console.log(`✅ Migrado: ${doc.id}`);
          }
        }
        
        console.log(`📊 ${coleccion}: ${migradosEnColeccion} documentos migrados`);
        
      } catch (error) {
        console.error(`❌ Error en ${coleccion}:`, error);
      }
    }

    console.log(`\n🎉 Migración completada. Total: ${totalMigrados} documentos`);
    console.log('🔄 Recarga la página para ver los cambios.');
    
    return totalMigrados;

  } catch (error) {
    console.error('❌ Error general en migración:', error);
  }
}

async function verificarEstadoMigracion() {
  try {
    if (!window.firebase || !window.firebase.auth || !window.firebase.firestore) {
      console.error('❌ Firebase no disponible');
      return;
    }

    const auth = window.firebase.auth();
    const db = window.firebase.firestore();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('❌ Usuario no autenticado');
      return;
    }

    console.log(`🔍 Verificando estado para: ${currentUser.uid}\n`);

    const colecciones = ['empleados', 'informesTecnicos', 'historialTrabajos', 'technicianStats'];
    
    for (const coleccion of colecciones) {
      try {
        const snapshot = await db.collection(coleccion).get();
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

        console.log(`📂 ${coleccion}: ${conUserId} con userId | ${sinUserId} sin userId`);
        
      } catch (error) {
        console.log(`❌ Error accediendo a ${coleccion}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

// Hacer funciones disponibles globalmente
window.migrarDatos = migrarDatosUsuario;
window.verificarMigracion = verificarEstadoMigracion;

console.log(`
🔧 MIGRACIÓN DE DATOS LISTA

Comandos disponibles:
1. verificarMigracion() - Ver estado actual
2. migrarDatos() - Migrar documentos sin userId

⚠️  IMPORTANTE:
- Estar logueado antes de ejecutar
- Solo ejecutar migrarDatos() UNA VEZ
- Recargar página después de migrar

Ejemplo de uso:
> verificarMigracion()
> migrarDatos()
> location.reload()
`);
