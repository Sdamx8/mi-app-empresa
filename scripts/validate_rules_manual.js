#!/usr/bin/env node

/**
 * Script manual para validar reglas de Firestore en emulator
 * 
 * Prerrequisitos:
 * 1. Ejecutar: firebase emulators:start --only firestore,auth
 * 2. Ejecutar: node scripts/validate_rules_manual.js
 */

console.log(`
🔥 VALIDACIÓN MANUAL DE REGLAS FIRESTORE
========================================

Este script te ayuda a validar las reglas de Firestore manualmente.

📋 PASOS PARA VALIDAR:

1️⃣  INICIAR EMULATOR:
   firebase emulators:start --only firestore,auth

2️⃣  CREAR USUARIOS DE PRUEBA:
   Ve a: http://localhost:4000/auth
   Crea usuarios con custom claims:

   Usuario Técnico:
   - Email: tecnico@test.com
   - UID: tecnico-test-1
   - Custom Claims: {"role": "tecnico"}

   Usuario Administrativo:
   - Email: admin@test.com  
   - UID: admin-test-1
   - Custom Claims: {"role": "administrativo"}

   Usuario Directivo:
   - Email: directivo@test.com
   - UID: directivo-test-1
   - Custom Claims: {"role": "directivo"}

3️⃣  PROBAR EN FIRESTORE UI:
   Ve a: http://localhost:4000/firestore
   
   Como Técnico (tecnico@test.com):
   ✅ Leer colección 'remisiones'
   ❌ Crear documento en 'remisiones' (debería fallar)
   ✅ Crear documento en 'remisiones/test/historial'
   ❌ Actualizar documento en 'remisiones/test/historial' (debería fallar)

   Como Administrativo (admin@test.com):
   ✅ Leer colección 'remisiones'
   ✅ Crear documento en 'remisiones'
   ✅ Actualizar 'remisiones' con estado 'pendiente'
   ❌ Actualizar 'remisiones' con estado 'finalizado' (debería fallar)
   ✅ Gestionar documentos en 'historial'

   Como Directivo (directivo@test.com):
   ✅ Todas las operaciones permitidas
   ✅ Gestionar empleados
   ✅ Gestionar herramientas

4️⃣  CASOS DE PRUEBA ESPECÍFICOS:

   A) Remisión con estado bloqueado:
      - Crear remisión: {"estado": "finalizado", "servicio": "test"}
      - Intentar actualizar como admin → Debería fallar
      - Intentar actualizar como directivo → Debería fallar (regla actual)

   B) Historial de actividades:
      - Como técnico: crear entrada en historial
      - Como técnico: intentar editar entrada → Debería fallar
      - Como admin: editar entrada → Debería funcionar

   C) Gestión de empleados:
      - Como técnico: leer empleados → Debería funcionar
      - Como técnico: crear empleado → Debería fallar
      - Como admin: gestionar empleados → Debería funcionar

5️⃣  VALIDACIONES ESPERADAS:

   Estados que bloquean modificaciones:
   - "finalizado"
   - "facturado" 
   - "cancelado"

   Roles válidos:
   - "tecnico": lectura + crear historial
   - "administrativo": gestión completa (excepto estados bloqueados)
   - "directivo": gestión completa

🚨 CASOS DE ERROR ESPERADOS:
   - Usuarios sin autenticación: acceso denegado a todo
   - Usuarios sin rol o rol inválido: acceso denegado
   - Técnicos intentando crear/modificar remisiones
   - Cualquier usuario modificando remisiones finalizadas

📊 ESTRUCTURA DE DATOS PARA PRUEBAS:

Remisión de ejemplo:
{
  "estado": "pendiente",
  "servicios": [
    {"nombre": "Mantenimiento", "numero": 1}
  ],
  "tecnicos": [
    {"nombre": "Juan Pérez", "numero": 1}
  ],
  "fecha_remision": "2024-01-15",
  "movil": "001"
}

Entrada de historial:
{
  "fechaActividad": "2024-01-15T10:30:00Z",
  "tecnico": "Juan Pérez",
  "actividad": "Revisión completada",
  "materiales": ["Cable", "Conector"],
  "tiempoMinutos": 120,
  "estado": "completado"
}

📝 REGISTRO DE VALIDACIÓN:
   □ Técnico puede leer remisiones
   □ Técnico NO puede crear remisiones  
   □ Técnico puede crear entradas en historial
   □ Técnico NO puede modificar historial
   □ Admin puede gestionar remisiones (estados permitidos)
   □ Admin NO puede modificar remisiones finalizadas
   □ Admin puede gestionar historial
   □ Directivo tiene acceso completo
   □ Usuarios sin auth son rechazados
   □ Usuarios sin rol son rechazados

🔧 COMANDOS ÚTILES:

# Iniciar emulators
firebase emulators:start --only firestore,auth

# Ver logs del emulator
firebase emulators:start --debug

# Importar datos de prueba (si disponible)
firebase emulators:start --import=./emulator-data --export-on-exit

🌐 URLS DEL EMULATOR:
   Firestore: http://localhost:4000/firestore
   Auth: http://localhost:4000/auth
   Logs: Ver terminal del emulator

¡Comienza la validación manual siguiendo estos pasos!
`);

// Script simple para verificar reglas programáticamente si es necesario
const verificarConfiguracion = () => {
  const fs = require('fs');
  const path = require('path');
  
  console.log('\n🔍 VERIFICANDO CONFIGURACIÓN...\n');
  
  // Verificar que existe firebase.json
  const firebaseConfigPath = path.join(process.cwd(), 'firebase.json');
  if (fs.existsSync(firebaseConfigPath)) {
    console.log('✅ firebase.json encontrado');
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    
    if (config.firestore && config.firestore.rules) {
      console.log(`✅ Reglas configuradas: ${config.firestore.rules}`);
    } else {
      console.log('❌ Reglas no configuradas en firebase.json');
    }
    
    if (config.emulators && config.emulators.firestore) {
      console.log(`✅ Emulator Firestore configurado en puerto: ${config.emulators.firestore.port}`);
    }
    
    if (config.emulators && config.emulators.auth) {
      console.log(`✅ Emulator Auth configurado en puerto: ${config.emulators.auth.port}`);
    }
  } else {
    console.log('❌ firebase.json no encontrado');
  }
  
  // Verificar que existen las reglas
  const rulesPath = path.join(process.cwd(), 'firestore.rules');
  if (fs.existsSync(rulesPath)) {
    console.log('✅ firestore.rules encontrado');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    
    // Verificar que contiene las funciones principales
    if (rules.includes('hasRole(')) {
      console.log('✅ Función hasRole() encontrada');
    }
    if (rules.includes('hasAnyRole(')) {
      console.log('✅ Función hasAnyRole() encontrada');  
    }
    if (rules.includes('canModifyByStatus(')) {
      console.log('✅ Función canModifyByStatus() encontrada');
    }
    
    // Verificar roles
    ['tecnico', 'administrativo', 'directivo'].forEach(role => {
      if (rules.includes(`'${role}'`)) {
        console.log(`✅ Rol '${role}' configurado`);
      }
    });
    
  } else {
    console.log('❌ firestore.rules no encontrado');
  }
  
  console.log('\n🚀 Configuración verificada. ¡Procede con la validación manual!');
};

verificarConfiguracion();
