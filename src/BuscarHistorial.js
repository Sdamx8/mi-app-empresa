import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

function BuscarHistorial() {
  const [movil, setMovil] = useState('');
  const [resultados, setResultados] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const buscarHistorial = async () => {
    try {
      const numeroLimpio = movil.replace(/\D/g, ''); // Elimina letras y guiones
      if (!numeroLimpio) {
        setMensaje('Por favor, ingrese un número de móvil válido.');
        setResultados([]);
        return;
      }

      const ref = collection(db, 'informes');
      const q = query(ref, where('MOVIL', '==', Number(numeroLimpio)));
      const querySnapshot = await getDocs(q);

      const datos = querySnapshot.docs.map(doc => doc.data());

      if (datos.length === 0) {
        setMensaje('No se encontraron resultados para este número de móvil.');
        setResultados([]);
      } else {
        setMensaje('');
        setResultados(datos);
      }
    } catch (error) {
      console.error('Error al buscar:', error);
      setMensaje('Hubo un error al buscar.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🔍 Buscar Historial por Número de MÓVIL</h2>
      <input
        type="text"
        value={movil}
        onChange={(e) => setMovil(e.target.value)}
        placeholder="Ej: Z70-4825"
        style={{ padding: '8px', marginRight: '10px', width: '200px' }}
      />
      <button onClick={buscarHistorial} style={{ padding: '8px 12px' }}>
        Buscar
      </button>

      {mensaje && <p style={{ marginTop: '20px', color: 'red' }}>{mensaje}</p>}

      {resultados.length > 0 && (
        <table border="1" cellPadding="8" style={{ marginTop: '20px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th>MÓVIL</th>
              <th>ORDEN</th>
              <th>DESCRIPCIÓN</th>
              <th>ESTADO</th>
              <th>PATIO</th>
              <th>TÉCNICO</th>
              <th>AUTORIZÓ</th>
              <th>CARROCERÍA</th>
              <th>FECHA REMISIÓN</th>
              <th>F. BIT-PROF</th>
              <th>GENERADO MAXI</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((item, index) => (
              <tr key={index}>
                <td>{item.MOVIL}</td>
                <td>{item.ORDEN}</td>
                <td>{item.DESCRIPCIÓN}</td>
                <td>{item.ESTADO}</td>
                <td>{item.PATIO}</td>
                <td>{item['GENERÓ']}</td>
                <td>{item['AUTORIZÓ']}</td>
                <td>{item.CARROCERIA}</td>
                <td>{item['FECHA REMISION']}</td>
                <td>{item['FECHA BIT-PROF']}</td>
                <td>{item['GENERADO MAXI']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default BuscarHistorial;

