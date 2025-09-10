#!/usr/bin/env node

/**
 * Script para probar la Cloud Function de exportación localmente
 * 
 * Uso:
 * 1. Iniciar emulators: firebase emulators:start --only functions,firestore,auth
 * 2. Ejecutar: node scripts/test_export_function.js
 */

const axios = require('axios');

// Configuración del emulator
const FUNCTIONS_URL = 'http://localhost:5001';
const PROJECT_ID = 'mi-app-empresa-nuevo'; // Cambiar por el ID real del proyecto
const FUNCTION_NAME = 'exportRemisiones';

// Mock de token de autenticación (en pruebas reales usar token válido)
const MOCK_TOKEN = 'mock-token-for-testing';

/**
 * Función principal de pruebas
 */
async function testExportFunction() {
  console.log('🧪 TESTING CLOUD FUNCTION - EXPORT REMISIONES\n');
  
  const baseUrl = `${FUNCTIONS_URL}/${PROJECT_ID}/us-central1/${FUNCTION_NAME}`;
  
  // Casos de prueba
  const testCases = [
    {
      name: 'Exportación básica Excel',
      payload: {
        filtros: {
          estado: 'pendiente'
        },
        tipo: 'excel',
        incluirHistorial: false
      }
    },
    {
      name: 'Exportación con filtros complejos',
      payload: {
        filtros: {
          fechaInicio: '2024-01-01',
          fechaFin: '2024-12-31',
          movil: '001',
          tecnico: 'Juan'
        },
        tipo: 'excel',
        incluirHistorial: false
      }
    },
    {
      name: 'Exportación PDF (debería fallar - no implementado)',
      payload: {
        filtros: {},
        tipo: 'pdf',
        incluirHistorial: false
      }
    },
    {
      name: 'Sin token de autorización (debería fallar)',
      payload: {
        filtros: {},
        tipo: 'excel'
      },
      skipAuth: true
    }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n🔍 Test ${i + 1}: ${testCase.name}`);
    console.log('Payload:', JSON.stringify(testCase.payload, null, 2));
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (!testCase.skipAuth) {
        headers['Authorization'] = `Bearer ${MOCK_TOKEN}`;
      }
      
      const response = await axios.post(baseUrl, testCase.payload, {
        headers,
        timeout: 30000 // 30 segundos
      });
      
      console.log('✅ Status:', response.status);
      console.log('✅ Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Error Status:', error.response.status);
        console.log('❌ Error Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Network Error:', error.message);
      }
    }
    
    // Pausa entre tests
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n🎉 Tests completados!');
  console.log('\n📋 NOTAS:');
  console.log('- Los tests con mock token fallarán en autenticación (esperado)');
  console.log('- Para tests reales, usar token de Firebase Auth válido');
  console.log('- Verificar que el emulator esté ejecutándose en puerto 5001');
  console.log('- La exportación PDF retornará error 501 (no implementada)');
}

/**
 * Función para generar payload de prueba
 */
function generateTestPayload() {
  return {
    filtros: {
      fechaInicio: '2024-01-01',
      fechaFin: '2024-12-31',
      estado: 'pendiente',
      movil: '001'
    },
    tipo: 'excel',
    incluirHistorial: false
  };
}

/**
 * Script para probar con datos reales (requiere configuración)
 */
async function testWithRealData() {
  console.log('\n🔧 CONFIGURACIÓN PARA TESTING REAL:\n');
  
  console.log('1. Iniciar emulators:');
  console.log('   firebase emulators:start --only functions,firestore,auth\n');
  
  console.log('2. Obtener token de autenticación:');
  console.log('   - Ir a http://localhost:4000/auth');
  console.log('   - Crear usuario de prueba');
  console.log('   - Agregar custom claim: {"role": "administrativo"}');
  console.log('   - Copiar ID token\n');
  
  console.log('3. Reemplazar MOCK_TOKEN con token real\n');
  
  console.log('4. Poblar Firestore con datos de prueba:');
  console.log('   - Ir a http://localhost:4000/firestore');
  console.log('   - Crear colección "remisiones"');
  console.log('   - Agregar documentos de ejemplo\n');
  
  console.log('5. Ejecutar tests nuevamente\n');
  
  console.log('📄 Ejemplo de documento remisión:');
  console.log(JSON.stringify({
    remision: 1001,
    fecha_remision: new Date().toISOString(),
    movil: '001',
    estado: 'pendiente',
    cliente: 'Cliente Test',
    direccion: 'Dirección Test',
    servicios: [
      { nombre: 'Mantenimiento preventivo', numero: 1 }
    ],
    tecnicos: [
      { nombre: 'Juan Pérez', numero: 1 }
    ],
    subtotal: 100000,
    iva: 19000,
    total: 119000
  }, null, 2));
}

// Verificar si axios está disponible
if (typeof require !== 'undefined') {
  try {
    require('axios');
    testExportFunction().catch(console.error);
  } catch (error) {
    console.log('❌ axios no está instalado. Ejecutar: npm install axios');
    console.log('📋 Mostrando configuración para testing manual...\n');
    testWithRealData();
  }
} else {
  testWithRealData();
}
