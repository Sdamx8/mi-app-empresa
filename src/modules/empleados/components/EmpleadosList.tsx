import React from 'react';
import { useEmpleados } from '../hooks/useEmpleados';
import type { Empleado } from '../types';
import { TIPOS_EMPLEADO, ESTADOS_EMPLEADO } from '../constants';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Modal from '../../../shared/components/Modal';
import { THEME } from '../../../shared/tokens/theme';

interface EmpleadosListProps {
  onEditEmpleado?: (empleado: Empleado) => void;
}

const EmpleadosList: React.FC<EmpleadosListProps> = ({ onEditEmpleado }) => {
  const {
    filteredEmpleados,
    loading,
    error,
    filters,
    setFilters,
    deleteEmpleado,
    totalEmpleados,
  } = useEmpleados();

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [empleadoToDelete, setEmpleadoToDelete] = React.useState<Empleado | null>(null);

  const handleDeleteClick = (empleado: Empleado) => {
    setEmpleadoToDelete(empleado);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (empleadoToDelete) {
      try {
        await deleteEmpleado(empleadoToDelete.id);
        setShowDeleteModal(false);
        setEmpleadoToDelete(null);
      } catch (error) {
        console.error('Error al eliminar empleado:', error);
      }
    }
  };

  const getTipoLabel = (tipo: string) => {
    return TIPOS_EMPLEADO.find(t => t.value === tipo)?.label || tipo;
  };

  const getEstadoLabel = (estado: string) => {
    return ESTADOS_EMPLEADO.find(e => e.value === estado)?.label || estado;
  };

  const getEstadoColor = (estado: string) => {
    return ESTADOS_EMPLEADO.find(e => e.value === estado)?.color || '#6c757d';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Cargando empleados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: THEME.colors.danger, padding: '1rem', textAlign: 'center' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filtros */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: THEME.radius.base 
      }}>
        <Input
          placeholder="Buscar empleado..."
          value={filters.busqueda || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, busqueda: e.target.value })}
        />
        
        <select
          value={filters.tipo || ''}
          onChange={(e) => setFilters({ ...filters, tipo: e.target.value as any })}
          style={{
            padding: '8px 12px',
            borderRadius: THEME.radius.base,
            border: '1px solid #BDC3C7',
          }}
        >
          <option value="">Todos los tipos</option>
          {TIPOS_EMPLEADO.map(tipo => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </select>

        <select
          value={filters.estado || ''}
          onChange={(e) => setFilters({ ...filters, estado: e.target.value as any })}
          style={{
            padding: '8px 12px',
            borderRadius: THEME.radius.base,
            border: '1px solid #BDC3C7',
          }}
        >
          <option value="">Todos los estados</option>
          {ESTADOS_EMPLEADO.map(estado => (
            <option key={estado.value} value={estado.value}>
              {estado.label}
            </option>
          ))}
        </select>
      </div>

      {/* Resumen */}
      <div style={{ marginBottom: '1rem' }}>
        <p><strong>Total de empleados: {totalEmpleados}</strong></p>
      </div>

      {/* Lista de empleados */}
      {filteredEmpleados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No se encontraron empleados</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredEmpleados.map(empleado => (
            <div
              key={empleado.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: THEME.radius.base,
                padding: '1rem',
                backgroundColor: 'white',
                boxShadow: THEME.shadow.sm,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: THEME.colors.dark }}>
                    {empleado.nombre} {empleado.apellido}
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '14px' }}>
                    <p><strong>Cédula:</strong> {empleado.cedula}</p>
                    <p><strong>Email:</strong> {empleado.email}</p>
                    <p><strong>Teléfono:</strong> {empleado.telefono}</p>
                    <p><strong>Cargo:</strong> {empleado.cargo}</p>
                    <p><strong>Tipo:</strong> {getTipoLabel(empleado.tipo)}</p>
                    <p>
                      <strong>Estado:</strong>{' '}
                      <span style={{ color: getEstadoColor(empleado.estado) }}>
                        {getEstadoLabel(empleado.estado)}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                  {onEditEmpleado && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEditEmpleado(empleado)}
                    >
                      Editar
                    </Button>
                  )}
                  
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(empleado)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: THEME.colors.danger }}>Confirmar Eliminación</h3>
          <p>
            ¿Está seguro que desea eliminar al empleado{' '}
            <strong>
              {empleadoToDelete?.nombre} {empleadoToDelete?.apellido}
            </strong>?
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Esta acción no se puede deshacer.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmpleadosList;