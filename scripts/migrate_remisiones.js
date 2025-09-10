#!/usr/bin/env node

/**
 * Script de Migración de Remisiones
 * 
 * Convierte la estructura antigua de remisiones a la nueva:
 * - servicio1..n → servicios array
 * - tecnico1..n → tecnicos array  
 * - estado → lowercase normalizado
 * - opcional: crea entradas iniciales en historial
 *
 * Uso:
 *   node scripts/migrate_remisiones.js --dry-run (default)
 *   node scripts/migrate_remisiones.js --apply
 *   node scripts/migrate_remisiones.js --apply --create-historial
 *
 * Requiere: 
 *   export FIREBASE_SA_KEY_PATH=./serviceAccountKey.json
 *   export FIREBASE_PROJECT_ID=tu-proyecto-id
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const minimist = require('minimist');

// Parse argumentos
const args = minimist(process.argv.slice(2), {
  boolean: ['dry-run', 'apply', 'create-historial', 'help'],
  default: { 
    'dry-run': true,
    'apply': false,
    'create-historial': false 
  }
});

// Mostrar ayuda si se solicita
if (args.help) {
  console.log(`
Uso del Script de Migración de Remisiones:

  node scripts/migrate_remisiones.js [opciones]

Opciones:
  --dry-run          Ejecuta simulación y muestra 10 ejemplos (por defecto)
  --apply            Ejecuta la migración real con backup
  --create-historial Crea entradas iniciales en subcolección historial
  --help             Muestra esta ayuda

Ejemplos:
  node scripts/migrate_remisiones.js
  node scripts/migrate_remisiones.js --apply
  node scripts/migrate_remisiones.js --apply --create-historial

Variables de entorno requeridas:
  FIREBASE_SA_KEY_PATH   Ruta al archivo serviceAccountKey.json
  FIREBASE_PROJECT_ID    ID del proyecto Firebase
  `);
  process.exit(0);
}

// Validar argumentos mutuamente excluyentes
if (args['dry-run'] && args['apply']) {
  console.error('❌ Error: No se puede usar --dry-run y --apply al mismo tiempo');
  process.exit(1);
}

// Configuración de Firebase
const saPath = process.env.FIREBASE_SA_KEY_PATH || './serviceAccountKey.json';
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error('❌ Error: Variable FIREBASE_PROJECT_ID no configurada');
  process.exit(1);
}

if (!fs.existsSync(saPath)) {
  console.error(`❌ Error: No se encontró SERVICE ACCOUNT key en: ${saPath}`);
  console.error('💡 Descarga el archivo desde Firebase Console > Configuración del proyecto > Cuentas de servicio');
  process.exit(1);
}

// Inicializar Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(require(path.resolve(saPath))),
    projectId: projectId
  });
  console.log('✅ Firebase Admin inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

/**
 * Obtiene todas las remisiones de la colección
 */
async function getAllRemisiones() {
  try {
    console.log('📡 Obteniendo remisiones de Firestore...');
    const snap = await db.collection('remisiones').get();
    console.log(`📊 Se encontraron ${snap.docs.length} remisiones`);
    return snap.docs;
  } catch (error) {
    console.error('❌ Error obteniendo remisiones:', error.message);
    throw error;
  }
}

/**
 * Transforma los datos de un documento según el nuevo esquema
 */
function transformDocData(data) {
  const transformedData = { ...data };
  
  // 1. Convertir servicio1..n → servicios array
  const servicios = [];
  for (let i = 1; i <= 20; i++) { // Amplio rango para capturar todos los servicios
    const servicioKey = `servicio${i}`;
    if (data[servicioKey] && typeof data[servicioKey] === 'string' && data[servicioKey].trim()) {
      servicios.push({ 
        nombre: data[servicioKey].trim(),
        numero: i 
      });
      delete transformedData[servicioKey];
    }
  }
  
  // 2. Convertir tecnico1..n → tecnicos array
  const tecnicos = [];
  for (let i = 1; i <= 10; i++) { // Amplio rango para capturar todos los técnicos
    const tecnicoKey = `tecnico${i}`;
    if (data[tecnicoKey] && typeof data[tecnicoKey] === 'string' && data[tecnicoKey].trim()) {
      tecnicos.push({ 
        nombre: data[tecnicoKey].trim(),
        numero: i 
      });
      delete transformedData[tecnicoKey];
    }
  }
  
  // 3. Normalizar estado a lowercase
  if (data.estado && typeof data.estado === 'string') {
    transformedData.estado = data.estado.toLowerCase().trim();
  }
  
  // Agregar arrays solo si tienen contenido
  if (servicios.length > 0) {
    transformedData.servicios = servicios;
  }
  if (tecnicos.length > 0) {
    transformedData.tecnicos = tecnicos;
  }
  
  // Agregar metadatos de migración
  transformedData.migratedAt = admin.firestore.FieldValue.serverTimestamp();
  transformedData.version = '2.0';
  
  return transformedData;
}

/**
 * Ejecuta el dry run mostrando ejemplos de transformación
 */
async function executeDryRun(docs) {
  console.log('\n🔍 ===== DRY RUN - SIMULACIÓN DE MIGRACIÓN =====\n');
  
  const samples = [];
  const maxSamples = Math.min(docs.length, 10);
  
  for (let i = 0; i < maxSamples; i++) {
    const doc = docs[i];
    const beforeData = doc.data();
    const afterData = transformDocData({ ...beforeData });
    
    samples.push({
      id: doc.id,
      before: beforeData,
      after: afterData,
      changes: {
        serviciosDetected: afterData.servicios?.length || 0,
        tecnicosDetected: afterData.tecnicos?.length || 0,
        estadoChanged: beforeData.estado !== afterData.estado
      }
    });
  }
  
  // Mostrar estadísticas generales
  let totalServicios = 0, totalTecnicos = 0, totalEstadosChanged = 0;
  
  samples.forEach(sample => {
    totalServicios += sample.changes.serviciosDetected;
    totalTecnicos += sample.changes.tecnicosDetected;
    if (sample.changes.estadoChanged) totalEstadosChanged++;
  });
  
  console.log('📊 ESTADÍSTICAS DE LA MUESTRA:');
  console.log(`   • Documentos analizados: ${samples.length}`);
  console.log(`   • Total servicios detectados: ${totalServicios}`);
  console.log(`   • Total técnicos detectados: ${totalTecnicos}`);
  console.log(`   • Estados que cambiarán: ${totalEstadosChanged}`);
  console.log('\n📋 EJEMPLOS DE TRANSFORMACIÓN:\n');
  
  samples.forEach((sample, index) => {
    console.log(`--- EJEMPLO ${index + 1}: Remisión ${sample.id} ---`);
    console.log('ANTES:');
    
    // Mostrar servicios antes
    const serviciosBefore = [];
    for (let i = 1; i <= 20; i++) {
      if (sample.before[`servicio${i}`]) {
        serviciosBefore.push(`  servicio${i}: "${sample.before[`servicio${i}`]}"`);
      }
    }
    if (serviciosBefore.length > 0) {
      console.log(serviciosBefore.join('\n'));
    }
    
    // Mostrar técnicos antes
    const tecnicosBefore = [];
    for (let i = 1; i <= 10; i++) {
      if (sample.before[`tecnico${i}`]) {
        tecnicosBefore.push(`  tecnico${i}: "${sample.before[`tecnico${i}`]}"`);
      }
    }
    if (tecnicosBefore.length > 0) {
      console.log(tecnicosBefore.join('\n'));
    }
    
    if (sample.before.estado) {
      console.log(`  estado: "${sample.before.estado}"`);
    }
    
    console.log('\nDESPUÉS:');
    if (sample.after.servicios) {
      console.log('  servicios:', JSON.stringify(sample.after.servicios, null, 2));
    }
    if (sample.after.tecnicos) {
      console.log('  tecnicos:', JSON.stringify(sample.after.tecnicos, null, 2));
    }
    if (sample.after.estado) {
      console.log(`  estado: "${sample.after.estado}"`);
    }
    console.log(`  migratedAt: [timestamp]`);
    console.log(`  version: "2.0"`);
    console.log('');
  });
  
  console.log('🚀 Para aplicar la migración real, ejecute:');
  console.log(`   node scripts/migrate_remisiones.js --apply`);
  
  if (args['create-historial']) {
    console.log('   --create-historial (crear entradas iniciales en historial)');
  }
  
  console.log('\n⚠️  IMPORTANTE: La migración creará un backup automático antes de modificar los datos.');
}

/**
 * Ejecuta la migración real con backup
 */
async function executeApply(docs) {
  console.log('\n🚀 ===== EJECUTANDO MIGRACIÓN REAL =====\n');
  
  // Crear nombre de colección de backup
  const backupColName = `remisiones_backup_${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;
  console.log(`💾 Creando backup en colección: ${backupColName}`);
  
  const BATCH_SIZE = 300; // Tamaño seguro para batches de Firestore
  let processedDocs = 0;
  
  try {
    // Procesar en batches
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batchDocs = docs.slice(i, i + BATCH_SIZE);
      const backupBatch = db.batch();
      const updateBatch = db.batch();
      
      console.log(`📦 Procesando batch ${Math.floor(i/BATCH_SIZE) + 1}: documentos ${i + 1} a ${Math.min(i + BATCH_SIZE, docs.length)}`);
      
      batchDocs.forEach(doc => {
        const remisionRef = db.collection('remisiones').doc(doc.id);
        const backupRef = db.collection(backupColName).doc(doc.id);
        
        const originalData = doc.data();
        const transformedData = transformDocData({ ...originalData });
        
        // Crear backup del documento original
        backupBatch.set(backupRef, originalData);
        
        // Actualizar documento con datos transformados
        updateBatch.set(remisionRef, transformedData, { merge: true });
      });
      
      // Ejecutar batch de backup primero
      await backupBatch.commit();
      console.log(`  ✅ Backup batch ${Math.floor(i/BATCH_SIZE) + 1} completado`);
      
      // Luego ejecutar batch de actualización
      await updateBatch.commit();
      console.log(`  ✅ Update batch ${Math.floor(i/BATCH_SIZE) + 1} completado`);
      
      processedDocs += batchDocs.length;
      console.log(`  📊 Progreso: ${processedDocs}/${docs.length} documentos procesados\n`);
    }
    
    console.log(`✅ Migración completada exitosamente!`);
    console.log(`📊 Total documentos migrados: ${processedDocs}`);
    console.log(`💾 Backup guardado en: ${backupColName}`);
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    throw error;
  }
}

/**
 * Crea entradas iniciales en la subcolección historial
 */
async function createHistorialEntries() {
  console.log('\n📝 ===== CREANDO ENTRADAS INICIALES EN HISTORIAL =====\n');
  
  try {
    // Obtener remisiones ya migradas
    const remisiones = await db.collection('remisiones').get();
    let totalHistorialEntries = 0;
    
    for (const remisionDoc of remisiones.docs) {
      const remisionData = remisionDoc.data();
      
      // Solo procesar si tiene servicios migrados
      if (!remisionData.servicios || remisionData.servicios.length === 0) {
        continue;
      }
      
      const historialCol = db.collection('remisiones').doc(remisionDoc.id).collection('historial');
      const batch = db.batch();
      
      // Crear entrada por cada servicio
      remisionData.servicios.forEach((servicio, index) => {
        const historialRef = historialCol.doc();
        const tecnicoAsignado = remisionData.tecnicos && remisionData.tecnicos[index] 
          ? remisionData.tecnicos[index].nombre 
          : (remisionData.tecnicos && remisionData.tecnicos[0] ? remisionData.tecnicos[0].nombre : null);
        
        batch.set(historialRef, {
          fechaActividad: admin.firestore.FieldValue.serverTimestamp(),
          tecnico: tecnicoAsignado,
          actividad: `Registro inicial del servicio: ${servicio.nombre}`,
          descripcion: `Servicio migrado automáticamente desde estructura anterior (servicio${servicio.numero})`,
          materiales: [],
          tiempoMinutos: null,
          estado: remisionData.estado || 'pendiente',
          tipo: 'migracion_inicial',
          servicioNumero: servicio.numero
        });
        
        totalHistorialEntries++;
      });
      
      await batch.commit();
      
      if (totalHistorialEntries % 50 === 0) {
        console.log(`📊 Entradas de historial creadas: ${totalHistorialEntries}`);
      }
    }
    
    console.log(`✅ Entradas de historial completadas!`);
    console.log(`📊 Total entradas creadas: ${totalHistorialEntries}`);
    
  } catch (error) {
    console.error('❌ Error creando entradas de historial:', error.message);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🔧 Iniciando script de migración de remisiones...\n');
    
    // Obtener todos los documentos
    const docs = await getAllRemisiones();
    
    if (docs.length === 0) {
      console.log('⚠️  No se encontraron remisiones para migrar.');
      return;
    }
    
    if (args['dry-run'] || (!args['apply'])) {
      await executeDryRun(docs);
    } else if (args['apply']) {
      // Confirmación de seguridad
      console.log('⚠️  ATENCIÓN: Esta operación modificará todos los documentos de remisiones.');
      console.log(`📊 Total documentos a procesar: ${docs.length}`);
      console.log('💾 Se creará un backup automático antes de la migración.');
      
      await executeApply(docs);
      
      if (args['create-historial']) {
        await createHistorialEntries();
      }
    }
    
    console.log('\n🎉 Script ejecutado exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error ejecutando el script:', error.message);
    process.exit(1);
  }
}

// Ejecutar script
main();
