import React from 'react';
import { db } from './firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const SubirHistorial = () => {
  const subirHistorial = async () => {
    try {
      const response = await fetch('/remisiones_convertidos.json');
      const datos = await response.json();

      for (const item of datos) {
        const ordenId = item['ORDEN'];
        if (!ordenId) continue;

        // Creamos la referencia directamente con la ruta completa
        const ref = doc(db, 'remisiones', ordenId.toString());
        await setDoc(ref, item);
      }

      alert('✅ Historial subido correctamente a Firebase');
    } catch (error) {
      console.error('❌ Error al subir historial:', error);
      alert('Hubo un error al subir los datos. Revisa la consola.');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Subir Historial de Trabajos</h2>
      <button onClick={subirHistorial}>Subir a Firebase</button>
    </div>
  );
};

export default SubirHistorial;
