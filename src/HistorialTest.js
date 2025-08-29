import React from 'react';

const HistorialTest = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Módulo de Historial - Prueba</h2>
      <p>Este es un módulo de historial simplificado para verificar que funciona correctamente.</p>
      <div style={{
        border: '1px solid #ddd',
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h3>Búsqueda de Historial</h3>
        <input 
          type="text" 
          placeholder="Buscar..." 
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginBottom: '10px'
          }}
        />
        <button style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Buscar
        </button>
      </div>
    </div>
  );
};

export default HistorialTest;
