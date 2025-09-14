// 🔍 DEBUG: Script para verificar datos de EMPLEADOS en Firestore
// Ejecutar en la consola del navegador para debuggear

// 1. Verificar si Firebase está disponible
console.log('Firebase db:', window.firebase || 'No disponible');

// 2. Consultar todos los empleados
import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/core/config/firebaseConfig';

async function debugEmpleados() {
  try {
    console.log('🔍 Consultando colección EMPLEADOS...');
    const empleadosRef = collection(db, 'EMPLEADOS');
    const snapshot = await getDocs(empleadosRef);
    
    console.log('📊 Total empleados encontrados:', snapshot.docs.length);
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`👤 Empleado ${index + 1}:`, {
        id: doc.id,
        email: data.email,
        nombre_completo: data.nombre_completo,
        allFields: Object.keys(data)
      });
    });
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ Error consultando empleados:', error);
  }
}

// Ejecutar automáticamente
debugEmpleados();