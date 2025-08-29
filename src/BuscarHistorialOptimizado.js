import React, { useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import LoginComponent from './LoginComponent';
import ResultsTable from './components/ResultsTable';
import useSearch from './hooks/useSearch';
import { THEME_COLORS, MESSAGES } from './constants';

const BuscarHistorialOptimizado = ({ canEdit = false, canDelete = false, userRole = 'tecnico', requireAuth = true }) => {
  const { user } = useAuth();
  const [busqueda, setBusqueda] = useState({
    remision: '',
    movil: '',
    estado: ''
  });
  
  const {
    resultados,
    cargando,
    mensaje,
    totalEncontrados,
    cache: tieneCache,
    buscarRemisiones,
    limpiarResultados
  } = useSearch();

  const handleBuscar = () => {
    buscarRemisiones(busqueda);
  };

  const limpiarBusqueda = useCallback(() => {
    setBusqueda({
      remision: '',
      movil: '',
      estado: ''
    });
    limpiarResultados();
  }, [limpiarResultados]);

  const handleInputChange = useCallback((campo, valor) => {
    setBusqueda(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  // Si requiere autenticación y no hay usuario, mostrar login
  if (requireAuth && !user) {
    return <LoginComponent />;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        color: '#2c3e50'
      }}>
        🔍 Buscar Historial de Remisiones
      </h2>

      {/* Indicador de permisos del usuario */}
      <div style={{
        backgroundColor: !requireAuth || !user ? '#fff3cd' : userRole === 'tecnico' ? '#e3f2fd' : '#f8f9fa',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: `1px solid ${!requireAuth || !user ? '#ffeaa7' : userRole === 'tecnico' ? '#bbdefb' : '#dee2e6'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '1.2rem' }}>
          {!requireAuth || !user ? '👁️' : userRole === 'tecnico' ? '👷‍♂️' : userRole === 'administrativo' ? '👔' : '🎯'}
        </span>
        <div>
          <strong>
            {!requireAuth || !user 
              ? 'Modo: Consulta Pública' 
              : userRole === 'tecnico' ? 'Modo: Técnico' : userRole === 'administrativo' ? 'Modo: Administrativo' : 'Modo: Directivo'
            }
          </strong>
          <div style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '2px' }}>
            {!requireAuth || !user
              ? '📋 Solo consulta - Puedes buscar y visualizar el historial sin autenticación'
              : userRole === 'tecnico' 
                ? '📋 Solo lectura - Puedes consultar el historial sin modificar registros'
                : canEdit && canDelete 
                  ? '✏️ Acceso completo - Puedes consultar, editar y eliminar registros'
                  : canEdit 
                    ? '✏️ Acceso de edición - Puedes consultar y editar registros'
                    : '📋 Solo lectura - Puedes consultar el historial'
            }
          </div>
        </div>
      </div>

      {/* Formulario de búsqueda */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: 'bold',
              color: '#495057'
            }}>
              Número de Remisión:
            </label>
            <input
              type="text"
              value={busqueda.remision}
              onChange={(e) => handleInputChange('remision', e.target.value)}
              placeholder="Ej: 12345"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: 'bold',
              color: '#495057'
            }}>
              Móvil:
            </label>
            <input
              type="text"
              value={busqueda.movil}
              onChange={(e) => handleInputChange('movil', e.target.value)}
              placeholder="Ej: MOV001"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: 'bold',
              color: '#495057'
            }}>
              Estado:
            </label>
            <input
              type="text"
              value={busqueda.estado}
              onChange={(e) => handleInputChange('estado', e.target.value)}
              placeholder="Ej: activo, pendiente"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleBuscar}
            disabled={cargando}
            style={{
              backgroundColor: cargando ? '#6c757d' : THEME_COLORS.primary,
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: cargando ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {cargando ? '🔄 Buscando...' : '🔍 Buscar'}
          </button>

          <button
            onClick={limpiarBusqueda}
            disabled={cargando}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: cargando ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>

      {/* Mensaje de resultado */}
      {mensaje && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: resultados.length > 0 ? '#d4edda' : '#f8d7da',
          border: `1px solid ${resultados.length > 0 ? '#c3e6cb' : '#f5c6cb'}`,
          color: resultados.length > 0 ? '#155724' : '#721c24'
        }}>
          {mensaje}
          {tieneCache && (
            <span style={{ fontSize: '12px', marginLeft: '10px', opacity: 0.7 }}>
              {MESSAGES.CACHE_UPDATED}
            </span>
          )}
        </div>
      )}

      {/* Resultados usando el componente optimizado */}
      <ResultsTable 
        resultados={resultados} 
        totalEncontrados={totalEncontrados}
        canEdit={requireAuth && user ? canEdit : false}
        canDelete={requireAuth && user ? canDelete : false}
        userRole={!requireAuth || !user ? 'publico' : userRole}
      />

      {/* Footer con información */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#6c757d',
        textAlign: 'center'
      }}>
        💡 <strong>Tip:</strong> Puede buscar por uno o varios criterios. 
        La búsqueda no distingue entre mayúsculas y minúsculas.
        {totalEncontrados > 0 && (
          <span> | Mostrando {totalEncontrados} resultado{totalEncontrados !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
};

export default BuscarHistorialOptimizado;
