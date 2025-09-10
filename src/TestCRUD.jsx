import React, { useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';

// Simulación simple de servicios para testing
const MockInformesService = {
  async obtenerInformes() {
    return [
      {
        id: '1',
        numeroRemision: 'TEST-001',
        movil: 'MOV-123',
        tecnico: 'Juan Pérez',
        elaboradoPor: 'test@example.com',
        fechaCreacion: new Date().toISOString(),
        tituloTrabajo: 'Trabajo de prueba',
        ubicacionUNE: 'UNE-001',
        observaciones: 'Observaciones de prueba',
        imagenAntesURL: null,
        imagenDespuesURL: null,
        trazabilidad: { estado: 'borrador' }
      }
    ];
  },

  async modificarInforme(id, datos) {
    console.log('Modificando informe:', id, datos);
    return { success: true, id };
  },

  async eliminarInforme(id) {
    console.log('Eliminando informe:', id);
    return { success: true };
  },

  async exportarInformePDF(id) {
    console.log('Exportando PDF:', id);
    return { success: true };
  }
};

const TestCRUDComponent = () => {
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [informeEditando, setInformeEditando] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Estados del formulario
  const [tituloTrabajo, setTituloTrabajo] = useState('');
  const [ubicacionUNE, setUbicacionUNE] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    cargarInformes();
  }, []);

  const cargarInformes = async () => {
    try {
      setLoading(true);
      setMessage('Cargando informes...');
      const result = await MockInformesService.obtenerInformes();
      setInformes(result);
      setMessage(`${result.length} informes cargados`);
    } catch (error) {
      console.error('Error cargando informes:', error);
      setMessage('Error al cargar informes');
    } finally {
      setLoading(false);
    }
  };

  const editarInforme = (informe) => {
    try {
      setTituloTrabajo(informe.tituloTrabajo || '');
      setUbicacionUNE(informe.ubicacionUNE || '');
      setObservaciones(informe.observaciones || '');
      setInformeEditando(informe);
      setModoEdicion(true);
      setMessage(`Editando informe ${informe.numeroRemision}`);
    } catch (error) {
      console.error('Error al editar:', error);
      setMessage('Error al cargar informe para edición');
    }
  };

  const guardarCambios = async () => {
    try {
      if (!informeEditando) {
        setMessage('No hay informe en edición');
        return;
      }

      setLoading(true);
      setMessage('Guardando cambios...');

      const datosActualizados = {
        tituloTrabajo: tituloTrabajo.trim(),
        ubicacionUNE: ubicacionUNE.trim(),
        observaciones: observaciones.trim()
      };

      await MockInformesService.modificarInforme(informeEditando.id, datosActualizados);
      
      // Actualizar el informe en el estado local
      setInformes(prev => prev.map(inf => 
        inf.id === informeEditando.id 
          ? { ...inf, ...datosActualizados }
          : inf
      ));

      cancelarEdicion();
      setMessage('Informe modificado exitosamente');
    } catch (error) {
      console.error('Error modificando:', error);
      setMessage('Error al modificar informe');
    } finally {
      setLoading(false);
    }
  };

  const eliminarInforme = async (informe) => {
    try {
      setLoading(true);
      setMessage('Eliminando informe...');
      setMostrarModal(false);

      await MockInformesService.eliminarInforme(informe.id);
      
      // Remover del estado local
      setInformes(prev => prev.filter(inf => inf.id !== informe.id));
      
      setMessage('Informe eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando:', error);
      setMessage('Error al eliminar informe');
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = async (informe) => {
    try {
      setLoading(true);
      setMessage('Exportando PDF...');

      await MockInformesService.exportarInformePDF(informe.id);
      
      setMessage('PDF exportado exitosamente');
    } catch (error) {
      console.error('Error exportando:', error);
      setMessage('Error al exportar PDF');
    } finally {
      setLoading(false);
    }
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setInformeEditando(null);
    setTituloTrabajo('');
    setUbicacionUNE('');
    setObservaciones('');
    setMessage('Edición cancelada');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🧪 Test CRUD - Informes Técnicos</h1>
      
      {/* Estado y mensajes */}
      <div style={{
        padding: '10px',
        margin: '10px 0',
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '4px'
      }}>
        <strong>Estado:</strong> {message}
        {loading && ' (Cargando...)'}
      </div>

      {/* Modo edición */}
      {modoEdicion && (
        <div style={{
          padding: '20px',
          margin: '10px 0',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px'
        }}>
          <h3>✏️ Editando Informe</h3>
          <div style={{ marginBottom: '10px' }}>
            <label>Título del Trabajo:</label>
            <input
              type="text"
              value={tituloTrabajo}
              onChange={(e) => setTituloTrabajo(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                margin: '5px 0',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Ubicación UNE:</label>
            <input
              type="text"
              value={ubicacionUNE}
              onChange={(e) => setUbicacionUNE(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                margin: '5px 0',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Observaciones:</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                margin: '5px 0',
                borderRadius: '4px',
                border: '1px solid #ccc',
                minHeight: '100px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={guardarCambios}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              💾 Guardar Cambios
            </button>
            <button
              onClick={cancelarEdicion}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de informes */}
      <div style={{ marginTop: '20px' }}>
        <h2>📋 Lista de Informes</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Remisión</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Móvil</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Técnico</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Ubicación UNE</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Estado</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {informes.map((informe) => (
              <tr key={informe.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{informe.numeroRemision}</td>
                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{informe.movil}</td>
                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{informe.tecnico}</td>
                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{informe.ubicacionUNE}</td>
                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: informe.trazabilidad?.estado === 'completado' ? '#d4edda' : '#fff3cd',
                    color: informe.trazabilidad?.estado === 'completado' ? '#155724' : '#856404'
                  }}>
                    {informe.trazabilidad?.estado === 'completado' ? '✅ Completado' : '⏳ Borrador'}
                  </span>
                </td>
                <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                    <button
                      onClick={() => editarInforme(informe)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => setMostrarModal(informe)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                    <button
                      onClick={() => exportarPDF(informe)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      📄 PDF
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmación */}
      {mostrarModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3>🗑️ Confirmar Eliminación</h3>
            <p>¿Está seguro de que desea eliminar el informe {mostrarModal.numeroRemision}?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setMostrarModal(false)}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ❌ Cancelar
              </button>
              <button
                onClick={() => eliminarInforme(mostrarModal)}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controles de prueba */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h3>🔧 Controles de Prueba</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={cargarInformes}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Recargar Lista
          </button>
          <button
            onClick={() => setMessage('Test de funcionalidad CRUD ejecutándose...')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🧪 Test CRUD
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente envuelto en Error Boundary
const TestCRUDWithErrorBoundary = () => (
  <ErrorBoundary>
    <TestCRUDComponent />
  </ErrorBoundary>
);

export default TestCRUDWithErrorBoundary;
