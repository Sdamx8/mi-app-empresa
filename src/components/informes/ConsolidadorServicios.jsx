// ConsolidadorServicios.jsx - Componente para mostrar servicios consolidados
import React, { useState, useEffect } from 'react';

const ConsolidadorServicios = ({ remisionData, serviciosConsolidados, onContinuar }) => {
  const [cargando, setCargando] = useState(false);
  
  if (!remisionData) {
    return null;
  }

  // Extraer servicios de la remisión
  const serviciosRemision = [];
  for (let i = 1; i <= 5; i++) {
    const servicio = remisionData[`servicio${i}`];
    if (servicio && servicio.trim() !== '') {
      serviciosRemision.push({
        numero: i,
        titulo: servicio
      });
    }
  }

  // Extraer técnicos
  const tecnicos = [];
  for (let i = 1; i <= 3; i++) {
    const tecnico = remisionData[`tecnico${i}`];
    if (tecnico && tecnico.trim() !== '') {
      tecnicos.push(tecnico);
    }
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    
    try {
      if (fecha.toDate) {
        // Es un Timestamp de Firestore
        return fecha.toDate().toLocaleDateString('es-CO');
      } else if (fecha instanceof Date) {
        return fecha.toLocaleDateString('es-CO');
      } else {
        return fecha.toString();
      }
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatearMoneda = (valor) => {
    if (!valor) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const handleContinuar = () => {
    setCargando(true);
    setTimeout(() => {
      onContinuar();
      setCargando(false);
    }, 500);
  };

  return (
    <div className="consolidador-servicios">
      <div className="consolidador-header">
        <h2>📋 Datos de la Remisión</h2>
        <p>Revisa la información encontrada antes de continuar</p>
      </div>

      {/* Información básica de la remisión */}
      <div className="remision-info">
        <h3>🔍 Información de la Remisión</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Número de Remisión:</label>
            <span className="valor-destacado">{remisionData.remision}</span>
          </div>
          <div className="info-item">
            <label>Fecha:</label>
            <span>{formatearFecha(remisionData.fecha_remision)}</span>
          </div>
          <div className="info-item">
            <label>Móvil:</label>
            <span>{remisionData.movil || 'No especificado'}</span>
          </div>
          <div className="info-item">
            <label>Carrocería:</label>
            <span>{remisionData.carroceria || 'No especificada'}</span>
          </div>
          <div className="info-item">
            <label>Autorizó:</label>
            <span>{remisionData.autorizo || 'No especificado'}</span>
          </div>
          <div className="info-item">
            <label>No. Orden:</label>
            <span>{remisionData.no_orden || 'No especificada'}</span>
          </div>
          <div className="info-item">
            <label>UNE:</label>
            <span>{remisionData.une || 'No especificada'}</span>
          </div>
          <div className="info-item">
            <label>Estado:</label>
            <span className={`estado ${remisionData.estado?.toLowerCase()}`}>
              {remisionData.estado || 'Sin estado'}
            </span>
          </div>
        </div>
      </div>

      {/* Servicios encontrados */}
      <div className="servicios-section">
        <h3>🛠️ Servicios Registrados ({serviciosRemision.length})</h3>
        <div className="servicios-lista">
          {serviciosRemision.map((servicio, index) => (
            <div key={index} className="servicio-item">
              <div className="servicio-numero">#{servicio.numero}</div>
              <div className="servicio-titulo">{servicio.titulo}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Técnicos asignados */}
      {tecnicos.length > 0 && (
        <div className="tecnicos-section">
          <h3>👥 Técnicos Asignados ({tecnicos.length})</h3>
          <div className="tecnicos-lista">
            {tecnicos.map((tecnico, index) => (
              <div key={index} className="tecnico-item">
                <span className="tecnico-icono">👤</span>
                <span className="tecnico-nombre">{tecnico}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información financiera */}
      <div className="financiero-section">
        <h3>💰 Información Financiera</h3>
        <div className="financiero-grid">
          <div className="financiero-item">
            <label>Subtotal:</label>
            <span>{formatearMoneda(remisionData.subtotal)}</span>
          </div>
          <div className="financiero-item total">
            <label>Total:</label>
            <span className="valor-total">{formatearMoneda(remisionData.total)}</span>
          </div>
        </div>
      </div>

      {/* Datos consolidados de servicios */}
      {serviciosConsolidados && (
        <div className="consolidado-section">
          <h3>🔄 Datos Consolidados</h3>
          <div className="consolidado-info">
            <div className="consolidado-item">
              <label>Descripciones encontradas:</label>
              <span>{serviciosConsolidados.descripciones?.length || 0}</span>
            </div>
            <div className="consolidado-item">
              <label>Materiales únicos:</label>
              <span>{serviciosConsolidados.materiales?.length || 0}</span>
            </div>
            <div className="consolidado-item">
              <label>Recursos humanos:</label>
              <span>{serviciosConsolidados.recursos?.length || 0}</span>
            </div>
            <div className="consolidado-item">
              <label>Tiempo estimado:</label>
              <span>{serviciosConsolidados.tiempoTotal?.horas || 0} horas</span>
            </div>
          </div>
        </div>
      )}

      {/* Botón continuar */}
      <div className="acciones">
        <button 
          onClick={handleContinuar} 
          disabled={cargando}
          className="btn-continuar"
        >
          {cargando ? '⏳ Cargando...' : '➡️ Continuar con el Informe'}
        </button>
      </div>

      <style jsx>{`
        .consolidador-servicios {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .consolidador-header {
          margin-bottom: 24px;
        }

        .consolidador-header h2 {
          color: #2c3e50;
          margin: 0 0 8px 0;
          font-size: 1.4rem;
        }

        .consolidador-header p {
          color: #7f8c8d;
          margin: 0;
        }

        .remision-info,
        .servicios-section,
        .tecnicos-section,
        .financiero-section,
        .consolidado-section {
          margin-bottom: 24px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #3498db;
        }

        .remision-info h3,
        .servicios-section h3,
        .tecnicos-section h3,
        .financiero-section h3,
        .consolidado-section h3 {
          margin: 0 0 16px 0;
          color: #2c3e50;
          font-size: 1.1rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .info-item label {
          font-weight: 500;
          color: #34495e;
          margin-right: 8px;
        }

        .valor-destacado {
          background: #3498db;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .estado {
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .estado.generado {
          background: #27ae60;
          color: white;
        }

        .servicios-lista {
          space-y: 8px;
        }

        .servicio-item {
          display: flex;
          align-items: flex-start;
          padding: 12px;
          background: white;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .servicio-numero {
          background: #3498db;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .servicio-titulo {
          flex: 1;
          line-height: 1.4;
          color: #2c3e50;
        }

        .tecnicos-lista {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tecnico-item {
          display: flex;
          align-items: center;
          background: white;
          padding: 8px 12px;
          border-radius: 6px;
        }

        .tecnico-icono {
          margin-right: 8px;
        }

        .tecnico-nombre {
          color: #2c3e50;
          font-weight: 500;
        }

        .financiero-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .financiero-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: white;
          border-radius: 6px;
        }

        .financiero-item.total {
          border: 2px solid #27ae60;
        }

        .financiero-item label {
          font-weight: 500;
          color: #34495e;
        }

        .valor-total {
          font-weight: 700;
          color: #27ae60;
          font-size: 1.1rem;
        }

        .consolidado-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .consolidado-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: white;
          border-radius: 6px;
        }

        .consolidado-item label {
          font-weight: 500;
          color: #34495e;
        }

        .consolidado-item span {
          background: #3498db;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .acciones {
          text-align: center;
          padding-top: 16px;
          border-top: 2px solid #ecf0f1;
        }

        .btn-continuar {
          background: #27ae60;
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-continuar:hover:not(:disabled) {
          background: #229954;
        }

        .btn-continuar:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .consolidador-servicios {
            padding: 16px;
            margin: 0 -8px 20px -8px;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }
          
          .tecnicos-lista {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ConsolidadorServicios;