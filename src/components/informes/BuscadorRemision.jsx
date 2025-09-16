/**
 * BUSCADOR DE REMISIÓN
 * Componente simple para buscar remisiones por número
 */

import React, { useState } from 'react';
import { informesService } from '../../services/informesService';

const BuscadorRemision = ({ onRemisionEncontrada, onError }) => {
  const [numeroRemision, setNumeroRemision] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [ultimaBusqueda, setUltimaBusqueda] = useState('');

  const buscarRemision = async () => {
    if (!numeroRemision.trim()) {
      onError('Por favor ingrese un número de remisión');
      return;
    }

    setBuscando(true);
    setUltimaBusqueda(numeroRemision);
    
    try {
      const remision = await informesService.buscarRemision(numeroRemision.trim());
      
      if (remision) {
        onRemisionEncontrada(remision);
      } else {
        onError(`No se encontró la remisión ${numeroRemision}`);
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      onError(error.message);
    } finally {
      setBuscando(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    buscarRemision();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      buscarRemision();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        🔍 Buscar Remisión
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="numeroRemision" className="block text-sm font-medium text-gray-700 mb-2">
            Número de Remisión
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              id="numeroRemision"
              value={numeroRemision}
              onChange={(e) => setNumeroRemision(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ej: 1002, 3004..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={buscando}
            />
            <button
              type="submit"
              disabled={buscando || !numeroRemision.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {buscando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </form>

      {ultimaBusqueda && !buscando && (
        <div className="mt-4 text-sm text-gray-500">
          Última búsqueda: {ultimaBusqueda}
        </div>
      )}
    </div>
  );
};

export default BuscadorRemision;