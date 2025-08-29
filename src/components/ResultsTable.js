// components/ResultsTable.js - Componente reutilizable para tabla de resultados
import React, { memo } from 'react';
import { THEME_COLORS } from '../constants';

const formatearFecha = (fecha) => {
  if (!fecha) return 'N/A';
  
  try {
    let fechaObj;
    if (typeof fecha === 'string') {
      fechaObj = new Date(fecha);
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

    if (isNaN(fechaObj.getTime())) return 'Fecha inválida';

    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Error fecha';
  }
};

const ResultsTable = memo(({ resultados, totalEncontrados, canEdit = false, canDelete = false, userRole = 'tecnico' }) => {
  if (!resultados || resultados.length === 0) {
    return null;
  }

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
        fontWeight: 'bold'
      }}>
        📋 Resultados de Búsqueda ({totalEncontrados} encontrados)
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ backgroundColor: THEME_COLORS.light }}>
              <th style={headerStyle}>Remisión</th>
              <th style={headerStyle}>Móvil</th>
              <th style={headerStyle}>Estado</th>
              <th style={headerStyle}>Fecha Remisión</th>
              <th style={headerStyle}>Descripción</th>
              <th style={headerStyle}>Subtotal</th>
              {(canEdit || canDelete) && (
                <th style={headerStyle}>Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {resultados.map((item, index) => (
              <TableRow 
                key={item.id || index} 
                item={item} 
                index={index} 
                canEdit={canEdit}
                canDelete={canDelete}
                userRole={userRole}
              />
            ))}
          </tbody>
        </table>
      </div>
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
TableRow.displayName = 'TableRow';
StatusBadge.displayName = 'StatusBadge';

export default ResultsTable;
