/**
 * 📊 Enhanced Remisiones Table Component
 * ====================================== 
 * Tabla avanzada con TanStack Table para visualización y administración completa de remisiones
 * Incluye filtros, ordenamiento, paginación, contadores de estado y administración en tiempo real
 * 
 * @author: Global Mobility Solutions
 * @version: 1.0.0
 * @date: September 2025
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useAuth } from '../../../core/auth/AuthContext';
import { useRealTimeRemisiones, useFilteredRemisiones, ESTADOS_REMISION, ESTADOS_CON_JUSTIFICACION } from '../hooks/useRealTimeRemisiones';
import { downloadConsolidatedPDF, validateAttachmentsForConsolidation } from '../lib/pdfConsolidation';
import './RemisionesTable.css';

const RemisionesTable = ({ onViewRemision = () => {}, onEditRemision = () => {} }) => {
  const { user } = useAuth();
  const { 
    remisiones, 
    loading, 
    error, 
    contadores, 
    updateRemision, 
    deleteRemision, 
    changeEstado 
  } = useRealTimeRemisiones();

  // Estados locales para filtros y UI
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([{ id: 'fecha_remision', desc: true }]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  
  // Estados para modales/acciones
  const [selectedRemision, setSelectedRemision] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [estadoForm, setEstadoForm] = useState({ estado: '', justificacion: '' });
  const [notification, setNotification] = useState(null);

  // Verificar si es usuario administrador
  const isAdmin = user?.email === 'davian.ayala7@gmail.com';

  // Función para formatear fechas
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Configuración de columnas para la tabla - ORDEN REQUERIDO
  const columns = useMemo(() => [
    // 1. ACCIONES - Primera columna
    {
      id: 'acciones',
      header: 'ACCIONES',
      size: 150,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEditRemision(row.original)}
            className="btn-action btn-secondary"
            title="Editar"
          >
            ✏️
          </button>
          <button
            onClick={() => onViewRemision(row.original)}
            className="btn-action btn-primary"
            title="Ver detalles"
          >
            👁️
          </button>
          {isAdmin && (
            <button
              onClick={() => handleDeleteRemision(row.original)}
              className="btn-action btn-danger"
              title="Eliminar remisión"
            >
              🗑️
            </button>
          )}
          <button
            onClick={() => handleDownloadPDF(row.original)}
            className="btn-action btn-success"
            title="Descargar PDF consolidado"
          >
            📄
          </button>
        </div>
      ),
    },
    // 2. REMISIÓN
    {
      accessorKey: 'remision',
      header: 'REMISIÓN',
      size: 100,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue()}</span>
      ),
    },
    // 3. MÓVIL
    {
      accessorKey: 'movil', 
      header: 'MÓVIL',
      size: 100,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm font-medium">{getValue()}</span>
      ),
    },
    // 4. NO. ORDEN
    {
      accessorKey: 'no_orden',
      header: 'NO. ORDEN',
      size: 120,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue()}</span>
      ),
    },
    // 5. ESTADO - Con botones funcionales
    {
      accessorKey: 'estado',
      header: 'ESTADO',
      size: 120,
      cell: ({ getValue, row }) => {
        const estado = getValue();
        const getEstadoClass = (estado) => {
          switch (estado) {
            case 'PENDIENTE': return 'status-pendiente';
            case 'RADICADO': return 'status-radicado'; 
            case 'FACTURADO': return 'status-facturado';
            case 'CANCELADO': return 'status-cancelado';
            case 'CORTESIA': return 'status-cortesia';
            case 'GARANTIA': return 'status-garantia';
            default: return 'status-generado';
          }
        };

        return (
          <div className="flex items-center gap-2">
            <span className={`status-badge ${getEstadoClass(estado)}`}>
              {estado}
            </span>
            <button
              onClick={() => handleChangeEstado(row.original)}
              className="btn-icon-sm"
              title="Cambiar estado"
            >
              🔄
            </button>
          </div>
        );
      },
    },
    // 6. FECHA REMISIÓN
    {
      accessorKey: 'fecha_remision',
      header: 'FECHA REMISIÓN',
      size: 120,
      cell: ({ getValue }) => formatDate(getValue()),
    },
    // 7. FECHA MÁXIMO
    {
      accessorKey: 'fecha_maximo',
      header: 'FECHA MÁXIMO',
      size: 120, 
      cell: ({ getValue }) => formatDate(getValue()),
    },
    // 8. SERVICIO 1
    {
      accessorKey: 'servicio1',
      header: 'SERVICIO 1',
      size: 150,
      cell: ({ getValue }) => (
        <span className="text-sm truncate">{getValue() || '-'}</span>
      ),
    },
    // 9. TOTAL
    {
      accessorKey: 'total',
      header: 'TOTAL',
      size: 120,
      cell: ({ getValue }) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(getValue())}
        </span>
      ),
    },
    // 10. UNE
    {
      accessorKey: 'une',
      header: 'UNE',
      size: 100,
      cell: ({ getValue }) => (
        <span className="text-sm font-medium">{getValue() || '-'}</span>
      ),
    },
    // 11. NO. ID BIT
    {
      accessorKey: 'no_id_bit',
      header: 'NO. ID BIT',
      size: 150,
      cell: ({ row }) => (
        <div style={{ textAlign: 'center' }}>
          {row.original.no_id_bit || '-'}
        </div>
      ),
    },
  ], [isAdmin, onViewRemision, onEditRemision]);

  // Configurar tabla con TanStack Table
  const table = useReactTable({
    data: remisiones,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      globalFilter,
      columnFilters,
      sorting,
      pagination,
    },
  });

  // Handlers para acciones
  const handleChangeEstado = (remision) => {
    setSelectedRemision(remision);
    setEstadoForm({ estado: remision.estado, justificacion: '' });
    setShowEstadoModal(true);
  };

  const handleDeleteRemision = (remision) => {
    setSelectedRemision(remision);
    setShowDeleteConfirm(true);
  };

  const handleDownloadPDF = async (remision) => {
    try {
      if (!remision.adjuntos) {
        showNotification('No hay adjuntos disponibles para consolidar', 'warning');
        return;
      }

      const attachments = {
        orden_trabajo: remision.adjuntos.orden_url ? {
          url: remision.adjuntos.orden_url,
          name: 'Orden de Trabajo.pdf',
          type: 'application/pdf'
        } : null,
        remision_escaneada: remision.adjuntos.remision_url ? {
          url: remision.adjuntos.remision_url,
          name: 'Remisión Escaneada',
          type: 'application/pdf'
        } : null,
        informe_tecnico: remision.adjuntos.informe_url ? {
          url: remision.adjuntos.informe_url,
          name: 'Informe Técnico.pdf',
          type: 'application/pdf'
        } : null
      };

      const validation = validateAttachmentsForConsolidation(attachments);
      
      if (!validation.canConsolidate) {
        showNotification('No hay archivos disponibles para consolidar', 'warning');
        return;
      }

      showNotification('Generando PDF consolidado...', 'info');

      const result = await downloadConsolidatedPDF(attachments, remision, {
        includeCover: false // Sin página de portada, solo los documentos unidos
        // El nombre se genera automáticamente en el servicio con formato: orden_movil.pdf
      });

      if (result.success) {
        showNotification(`PDF consolidado descargado: ${result.fileName}`, 'success');
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Error downloading PDF:', error);
      showNotification('Error al generar PDF: ' + error.message, 'error');
    }
  };

  const confirmChangeEstado = async () => {
    if (!selectedRemision || !estadoForm.estado) return;

    const result = await changeEstado(
      selectedRemision.id,
      estadoForm.estado,
      estadoForm.justificacion
    );

    if (result.success) {
      showNotification('Estado actualizado correctamente', 'success');
      setShowEstadoModal(false);
      setSelectedRemision(null);
    } else {
      showNotification(`Error: ${result.error}`, 'error');
    }
  };

  const confirmDeleteRemision = async () => {
    if (!selectedRemision) return;

    const result = await deleteRemision(selectedRemision.id);

    if (result.success) {
      showNotification('Remisión eliminada correctamente', 'success');
      setShowDeleteConfirm(false);
      setSelectedRemision(null);
    } else {
      showNotification(`Error: ${result.error}`, 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="remisiones-table-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando remisiones...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="remisiones-table-container">
        <div className="error-message">
          <p>Error al cargar las remisiones: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="remisiones-table-container">
      {/* Notificación */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Contadores de estados */}
      <div className="status-counters">
        <div className="counter pendientes">
          🔴 Pendientes: <span>{contadores.PENDIENTE || 0}</span>
        </div>
        <div className="counter radicados">
          🟢 Radicados: <span>{contadores.RADICADO || 0}</span>
        </div>
        <div className="counter total">
          📊 Total: <span>{remisiones.length}</span>
        </div>
      </div>

      {/* Controles superiores */}
      <div className="table-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar en todas las columnas..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="table-info">
          Mostrando {table.getRowModel().rows.length} de {remisiones.length} remisiones
        </div>
      </div>

      {/* Tabla principal */}
      <div className="table-wrapper">
        <table className="remisiones-table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={header.column.getCanSort() ? 'sortable' : ''}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="th-content">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <span className="sort-indicator">
                          {header.column.getIsSorted() === 'asc' ? ' 🔼' : 
                           header.column.getIsSorted() === 'desc' ? ' 🔽' : ' ↕️'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => {
              const isPendiente = row.original.estado === 'PENDIENTE';
              return (
                <tr 
                  key={row.id}
                  className={isPendiente ? 'row-pendiente' : ''}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="pagination-controls">
        <div className="pagination-info">
          Página {table.getState().pagination.pageIndex + 1} de{' '}
          {table.getPageCount()}
        </div>
        
        <div className="pagination-buttons">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="btn-pagination"
          >
            {'<<'}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="btn-pagination"
          >
            {'<'}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="btn-pagination"
          >
            {'>'}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="btn-pagination"
          >
            {'>>'}
          </button>
        </div>

        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          className="page-size-select"
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Mostrar {pageSize}
            </option>
          ))}
        </select>
      </div>

      {/* Modal cambiar estado */}
      {showEstadoModal && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cambiar Estado de Remisión</h3>
            <p>Remisión: {selectedRemision?.remision} - Móvil: {selectedRemision?.movil}</p>
            
            <div className="form-group">
              <label>Nuevo Estado:</label>
              <select
                value={estadoForm.estado}
                onChange={(e) => setEstadoForm(prev => ({...prev, estado: e.target.value}))}
                className="form-input"
              >
                {ESTADOS_REMISION.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>

            {ESTADOS_CON_JUSTIFICACION.includes(estadoForm.estado) && (
              <div className="form-group">
                <label>Justificación:</label>
                <textarea
                  value={estadoForm.justificacion}
                  onChange={(e) => setEstadoForm(prev => ({...prev, justificacion: e.target.value}))}
                  placeholder="Ingrese la justificación para este estado..."
                  className="form-textarea"
                  rows={3}
                />
              </div>
            )}

            <div className="modal-actions">
              <button 
                onClick={() => setShowEstadoModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmChangeEstado}
                className="btn-primary"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminar */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmar Eliminación</h3>
            <p>¿Está seguro de que desea eliminar la remisión:</p>
            <p><strong>{selectedRemision?.remision} - Móvil: {selectedRemision?.movil}</strong></p>
            <p className="text-danger">Esta acción no se puede deshacer.</p>
            
            <div className="modal-actions">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteRemision}
                className="btn-danger"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemisionesTable;