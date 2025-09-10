// components/ResultsTable.js - Componente reutilizable para tabla de resultados
import React, { memo } from 'react';
import { THEME_COLORS } from '../../../shared/constants';

const formatearFecha = (fecha) => {
  if (!fecha) return 'N/A';
  
  try {
    let fechaObj;
    if (typeof fecha === 'string') {
      // Manejar formato DD/MM/YYYY (como "18/05/2025")
      if (fecha.includes('/')) {
        const partes = fecha.split('/');
        if (partes.length === 3) {
          const [dia, mes, año] = partes;
          // Crear fecha en formato ISO (YYYY-MM-DD)
          fechaObj = new Date(`${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`);
        } else {
          fechaObj = new Date(fecha);
        }
      } else {
        fechaObj = new Date(fecha);
      }
    } else if (fecha.toDate && typeof fecha.toDate === 'function') {
      fechaObj = fecha.toDate();
    } else if (fecha instanceof Date) {
      fechaObj = fecha;
    } else if (typeof fecha === 'number') {
      // Si es número, convertir desde formato YYYYMMDD
      const fechaStr = fecha.toString();
      if (fechaStr.length === 8) {
        const year = fechaStr.substring(0, 4);
        const month = fechaStr.substring(4, 6);
        const day = fechaStr.substring(6, 8);
        fechaObj = new Date(`${year}-${month}-${day}`);
      } else {
        return fecha.toString();
      }
    } else {
      return 'Formato desconocido';
    }

    if (isNaN(fechaObj.getTime())) {
      console.warn('Fecha inválida recibida:', fecha);
      return fecha.toString(); // Devolver la fecha original si no se puede parsear
    }

    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error, 'Fecha original:', fecha);
    return fecha.toString(); // Devolver la fecha original en caso de error
  }
};

const ResultsTable = memo(({ resultados, totalEncontrados, canEdit = false, canDelete = false, userRole = 'tecnico' }) => {
  if (!resultados || resultados.length === 0) {
    return null;
  }

  // Función para validar la fecha de remisión
  const validarFechaRemision = (fecha) => {
    try {
      const fechaRemision = new Date(fecha);
      const fechaActual = new Date();
      const diferenciaMeses = (fechaActual - fechaRemision) / (1000 * 60 * 60 * 24 * 30.44); // Aproximadamente 30.44 días por mes
      
      return diferenciaMeses < 6 ? {
        color: '#dc3545',
        backgroundColor: '#f8d7da',
        borderColor: '#f1aeb5'
      } : {
        color: '#198754',
        backgroundColor: '#d1e7dd',
        borderColor: '#a3cfbb'
      };
    } catch (error) {
      return {
        color: '#6c757d',
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6'
      };
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      overflow: 'hidden'
    }}>
      <div style={{
        backgroundColor: THEME_COLORS.primary,
        color: 'white',
        padding: '15px',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>📋 Resultados de Búsqueda ({totalEncontrados} encontrados)</span>
        <span style={{ fontSize: '12px', opacity: 0.9 }}>
          📊 Vista en Columnas - Perfil {userRole === 'tecnico' ? 'Técnico' : userRole}
        </span>
      </div>

      {/* Formato de columnas (tarjetas) */}
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {resultados.map((item, index) => {
            const estiloFecha = validarFechaRemision(item.fecha_remision || item['fecha_id-bit']);
            
            return (
              <div 
                key={item.id || index} 
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'}
                onMouseLeave={(e) => e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}
              >
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '15px'
                }}>
                  
                  {/* Primera columna */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        color: '#6c757d', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                        display: 'block'
                      }}>
                        Móvil
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#212529' }}>
                        {item.movil || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        color: '#6c757d', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                        display: 'block'
                      }}>
                        Remisión
                      </span>
                      <span style={{ fontSize: '14px', color: '#495057' }}>
                        #{item.remision || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        color: '#6c757d', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                        display: 'block'
                      }}>
                        Fecha de Remisión
                      </span>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid',
                        display: 'inline-block',
                        ...estiloFecha
                      }}>
                        {formatearFecha(item.fecha_remision || item['fecha_id-bit'])}
                      </span>
                    </div>

                    <div>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        color: '#6c757d', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                        display: 'block'
                      }}>
                        Estado
                      </span>
                      <StatusBadge estado={item.estado} />
                    </div>
                  </div>

                  {/* Segunda columna */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        color: '#6c757d', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                        display: 'block'
                      }}>
                        Descripción
                      </span>
                      <span style={{ fontSize: '14px', color: '#495057' }}>
                        {item.descripcion || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        color: '#6c757d', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                        display: 'block'
                      }}>
                        Subtotal
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#212529' }}>
                        {item.subtotal ? 
                          new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP'
                          }).format(item.subtotal) : 'N/A'
                        }
                      </span>
                    </div>

                    {/* Acciones */}
                    {(canEdit || canDelete) && (
                      <div>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          color: '#6c757d', 
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '8px',
                          display: 'block'
                        }}>
                          Acciones
                        </span>
                        <ActionButtons 
                          item={item}
                          canEdit={canEdit}
                          canDelete={canDelete}
                          userRole={userRole}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

const ActionButtons = memo(({ item, canEdit, canDelete, userRole }) => {
  const handleEdit = () => {
    console.log('Editando item:', item);
    alert(`Función de edición para remisión: ${item.remision || 'N/A'}\n(Función en desarrollo)`);
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la remisión ${item.remision || 'N/A'}?`)) {
      console.log('Eliminando item:', item);
      alert(`Función de eliminación para remisión: ${item.remision || 'N/A'}\n(Función en desarrollo)`);
    }
  };

  const handleGenerarInforme = () => {
    const numeroRemision = item.remision || item.numero_remision || item.id;
    if (!numeroRemision) {
      alert('No se puede generar el informe: número de remisión no encontrado');
      return;
    }

    const event = new CustomEvent('generarInformeTecnico', {
      detail: {
        numeroRemision: numeroRemision,
        datosRemision: {
          numeroRemision: numeroRemision,
          movil: item.movil || 'Sin móvil',
          tecnico: item.tecnico || item.empleado || 'Sin asignar',
          fechaRemision: formatearFecha(item.fecha_remision || item['fecha_id-bit']),
          autorizadoPor: item.autorizo || item.autorizado_por || item.autorizadoPor || 'Sin autorizar',
          une: item.une || 'Sin UNE especificada',
          descripcion: item.descripcion || '',
          subtotal: item.subtotal || 0,
          total: item.total || 0
        }
      }
    });
    
    window.dispatchEvent(event);
    alert(`Redirigiendo al módulo de Informes Técnicos para la remisión: ${numeroRemision}`);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {canEdit && (
        <button
          onClick={handleEdit}
          style={{
            padding: '6px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Editar remisión"
        >
          ✏️ Editar
        </button>
      )}
      
      {(userRole === 'directivo' || userRole === 'administrativo') && (
        <button
          onClick={handleGenerarInforme}
          style={{
            padding: '6px 12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Generar informe técnico"
        >
          📋 Informe
        </button>
      )}
      
      {canDelete && (
        <button
          onClick={handleDelete}
          style={{
            padding: '6px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Eliminar remisión"
        >
          🗑️ Eliminar
        </button>
      )}
    </div>
  );
});

const TableRow = memo(({ item, index, canEdit = false, canDelete = false, userRole = 'tecnico' }) => {
  const handleEdit = () => {
    // Aquí iría la lógica para editar
    console.log('Editando item:', item);
    alert(`Función de edición para remisión: ${item.remision || 'N/A'}\n(Función en desarrollo)`);
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la remisión ${item.remision || 'N/A'}?`)) {
      // Aquí iría la lógica para eliminar
      console.log('Eliminando item:', item);
      alert(`Función de eliminación para remisión: ${item.remision || 'N/A'}\n(Función en desarrollo)`);
    }
  };

  const handleGenerarInforme = () => {
    // Función para generar informe técnico
    const numeroRemision = item.remision || item.numero_remision || item.id;
    if (!numeroRemision) {
      alert('No se puede generar el informe: número de remisión no encontrado');
      return;
    }

    // Crear evento personalizado para comunicar con el Dashboard
    const event = new CustomEvent('generarInformeTecnico', {
      detail: {
        numeroRemision: numeroRemision,
        datosRemision: {
          numeroRemision: numeroRemision,
          movil: item.movil || 'Sin móvil', // INCLUIR MÓVIL
          tecnico: item.tecnico || item.empleado || 'Sin asignar',
          fechaRemision: formatearFecha(item.fecha_remision || item['fecha_id-bit']),
          autorizadoPor: item.autorizo || item.autorizado_por || item.autorizadoPor || 'Sin autorizar', // CORREGIDO: usar "autorizo"
          une: item.une || 'Sin UNE especificada', // NUEVO: Campo UNE
          descripcion: item.descripcion || '',
          subtotal: item.subtotal || 0, // NUEVO: Subtotal
          total: item.total || 0 // NUEVO: Total
        }
      }
    });
    
    window.dispatchEvent(event);
    alert(`Redirigiendo al módulo de Informes Técnicos para la remisión: ${numeroRemision}`);
  };

  return (
    <tr style={{
      backgroundColor: index % 2 === 0 ? '#ffffff' : THEME_COLORS.light
    }}>
      <td style={cellStyle}>
        {item.remision || 'N/A'}
      </td>
      <td style={cellStyle}>
        {item.movil || 'N/A'}
      </td>
      <td style={cellStyle}>
        <StatusBadge estado={item.estado} />
      </td>
      <td style={cellStyle}>
        {formatearFecha(item.fecha_remision || item['fecha_id-bit'])}
      </td>
      <td style={{
        ...cellStyle,
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {item.descripcion || 'N/A'}
      </td>
      <td style={{ ...cellStyle, textAlign: 'right' }}>
        {item.subtotal ? 
          new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
          }).format(item.subtotal) : 'N/A'
        }
      </td>
      {(canEdit || canDelete) && (
        <td style={{ ...cellStyle, textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {canEdit && (
              <button
                onClick={handleEdit}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="Editar remisión"
              >
                ✏️ Editar
              </button>
            )}
            
            {/* Botón para generar informe técnico - disponible para directivos y administrativos */}
            {(userRole === 'directivo' || userRole === 'administrativo') && (
              <button
                onClick={handleGenerarInforme}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="Generar informe técnico"
              >
                📋 Informe
              </button>
            )}
            
            {canDelete && (
              <button
                onClick={handleDelete}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="Eliminar remisión"
              >
                🗑️ Eliminar
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
});

const StatusBadge = memo(({ estado }) => (
  <span style={{
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    backgroundColor: estado === 'activo' ? '#d4edda' : '#fff3cd',
    color: estado === 'activo' ? '#155724' : '#856404'
  }}>
    {estado || 'N/A'}
  </span>
));

const headerStyle = {
  padding: '12px 8px',
  textAlign: 'left',
  borderBottom: '1px solid #dee2e6',
  fontWeight: 'bold'
};

const cellStyle = {
  padding: '8px',
  borderBottom: '1px solid #dee2e6'
};

ResultsTable.displayName = 'ResultsTable';
ActionButtons.displayName = 'ActionButtons';
TableRow.displayName = 'TableRow';
StatusBadge.displayName = 'StatusBadge';

export default ResultsTable;
