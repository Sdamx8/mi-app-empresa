// BuscadorRemision.jsx - Componente para buscar remisión por número
import React, { useState } from 'react';


const BuscadorRemision = ({ onRemisionEncontrada, loading }) => {
  const [numeroRemision, setNumeroRemision] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Limpiar errores previos
    setError('');
    
    // Validar input
    const numero = numeroRemision.trim();
    if (!numero) {
      setError('Por favor ingresa un número de remisión');
      return;
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(numero)) {
      setError('El número de remisión solo puede contener letras y números');
      return;
    }

    console.log('🔍 Iniciando búsqueda de remisión:', numero);
    onRemisionEncontrada(numero);
  };

  const handleInputChange = (e) => {
    const valor = e.target.value;
    setNumeroRemision(valor);
    
    // Limpiar error al escribir
    if (error) {
      setError('');
    }
  };

  return (
    <div className="buscador-remision">
      <div className="buscador-header">
        <h2>🔍 Buscar Remisión</h2>
        <p>Ingresa el número de remisión para crear el informe técnico</p>
      </div>

      <form onSubmit={handleSubmit} className="buscador-form">
        <div className="input-group">
          <label htmlFor="numeroRemision">
            Número de Remisión *
          </label>
          <input
            id="numeroRemision"
            type="text"
            value={numeroRemision}
            onChange={handleInputChange}
            placeholder="Ej: 1002, 3004, etc."
            disabled={loading}
            className={error ? 'input-error' : ''}
            autoComplete="off"
          />
          {error && (
            <span className="error-message">❌ {error}</span>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading || !numeroRemision.trim()}
          className="btn-buscar"
        >
          {loading ? '🔄 Buscando...' : '🔍 Buscar Remisión'}
        </button>
      </form>

      <div className="ayuda-busqueda">
        <h4>💡 Información</h4>
        <ul>
          <li>El número debe coincidir exactamente con la remisión registrada</li>
          <li>Solo se aceptan números y letras (sin espacios ni símbolos)</li>
          <li>La búsqueda mostrará todos los datos de la remisión encontrada</li>
        </ul>
      </div>

      <style jsx>{`
        .buscador-remision {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .buscador-header {
          margin-bottom: 24px;
        }

        .buscador-header h2 {
          color: #2c3e50;
          margin: 0 0 8px 0;
          font-size: 1.4rem;
        }

        .buscador-header p {
          color: #7f8c8d;
          margin: 0;
        }

        .buscador-form {
          margin-bottom: 24px;
        }

        .input-group {
          margin-bottom: 16px;
        }

        .input-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #34495e;
        }

        .input-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #bdc3c7;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .input-group input:focus {
          outline: none;
          border-color: #3498db;
        }

        .input-group input:disabled {
          background-color: #f8f9fa;
          cursor: not-allowed;
        }

        .input-group input.input-error {
          border-color: #e74c3c;
        }

        .error-message {
          display: block;
          color: #e74c3c;
          font-size: 0.9rem;
          margin-top: 4px;
        }

        .btn-buscar {
          background: #3498db;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          width: 100%;
        }

        .btn-buscar:hover:not(:disabled) {
          background: #2980b9;
        }

        .btn-buscar:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        .ayuda-busqueda {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 6px;
          border-left: 4px solid #3498db;
        }

        .ayuda-busqueda h4 {
          margin: 0 0 12px 0;
          color: #2c3e50;
          font-size: 1rem;
        }

        .ayuda-busqueda ul {
          margin: 0;
          padding-left: 20px;
        }

        .ayuda-busqueda li {
          color: #7f8c8d;
          margin-bottom: 4px;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .buscador-remision {
            padding: 16px;
            margin: 0 -8px 20px -8px;
          }
        }
      `}</style>
    </div>
  );
};

export default BuscadorRemision;