/**
 * 📊 REMISIONES CONSOLIDADO SPREADSHEET - Google Sheets Style Interface
 * =====================================================================
 * Interfaz tipo hoja de cálculo para ingreso masivo de remisiones con estado IMPRESO
 * 
 * @author: Global Mobility Solutions
 * @version: 2.0.0
 * @date: September 2025
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../core/auth/AuthContext';
import { THEME } from '../../../shared/tokens/theme';
import {
  useServicios,
  useEmpleados,
  useCurrentUser,
  useRemisionSaver,
  useCalculateTotals
} from '../../ingresar-trabajo/hooks/useFirestoreHooks';
import DynamicServices from './DynamicServices';
import './RemisionesSpreadsheet.css';
import '../styles/RemisionesConsolidado.css';

// Estados disponibles para remisiones
const ESTADOS_REMISION = [
  'CANCELADO',
  'GARANTIA', 
  'CORTESIA',
  'GENERADO',
  'IMPRESO',
  'PROFORMA',
  'RADICADO',
  'SIN_VINCULAR'
];

// UNE disponibles
const UNE_OPTIONS = [
  'AUTOSUR',
  'ALIMENTADORES', 
  'SEVILLANA',
  'SANBERNARDINO',
  'SANJOSE1',
  'SANJOSE2'
];

// Estructura base de una fila de remisión (según estructura Firestore)
const createEmptyRow = () => ({
  id: Date.now() + Math.random(), // Solo para React, se elimina al guardar
  remision: '', // string - permite formato libre como "1262" o "REM-1262"
  movil: '', // string - permite formato libre como "7777" o "BO-0177"
  no_orden: '', // string
  estado: 'GENERADO', // string - por defecto GENERADO
  servicios: [''], // array - servicios dinámicos, por defecto un servicio vacío
  fecha_remision: new Date(), // timestamp
  fecha_maximo: new Date(), // timestamp
  fecha_bit_prof: new Date(), // timestamp
  radicacion: new Date(), // timestamp
  no_id_bit: 0, // number
  no_fact_elect: '', // string
  subtotal: 0, // number
  total: 0, // number
  une: '', // string
  carroceria: '', // string
  autorizo: '', // string
  tecnico1: '', // string - vacío por defecto para evitar warnings de React
  tecnico2: '', // string - vacío por defecto para evitar warnings de React
  tecnico3: '', // string - vacío por defecto para evitar warnings de React
  genero: '', // string
});

const RemisionesSpreadsheet = () => {
  // State management
  const [rows, setRows] = useState([createEmptyRow()]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [notification, setNotification] = useState(null);
  
  const { user } = useAuth();
  
  // Custom hooks
  const { servicios, serviciosForSelect, loading: serviciosLoading, getCostoByTitulo } = useServicios();
  const { empleados, empleadosForSelect, loading: empleadosLoading } = useEmpleados();
  const { userData, loading: userLoading } = useCurrentUser(user?.email);
  const { saveMultipleRemisiones, saving, error: saveError } = useRemisionSaver();
  const { calculateRowTotals } = useCalculateTotals(getCostoByTitulo);
  
  const loading = serviciosLoading || empleadosLoading || userLoading;

  // Set genero field when user data is loaded
  useEffect(() => {
    console.log('🔍 DEBUG genero - userData:', userData);
    console.log('🔍 DEBUG genero - user:', user);
    console.log('🔍 DEBUG genero - userLoading:', userLoading);
    
    let generoValue = '';
    
    if (userData && userData.nombre_completo) {
      // Opción 1: Usar nombre completo desde EMPLEADOS
      generoValue = userData.nombre_completo;
      console.log('✅ Genero desde EMPLEADOS:', generoValue);
    } else if (!userLoading && user?.email) {
      // Opción 2: Solo usar email si ya terminó de cargar y no hay userData
      console.log('⚠️ No se encontró userData.nombre_completo, usando fallback');
      generoValue = user.email.split('@')[0].replace(/[._-]/g, ' ').toUpperCase();
      console.log('⚠️ Genero desde email (fallback):', generoValue);
    } else if (!userLoading && !user) {
      // Opción 3: Usuario por defecto
      generoValue = 'Usuario Sistema';
      console.log('ℹ️ Genero por defecto:', generoValue);
    }
    
    if (generoValue) {
      setRows(prev => prev.map(row => ({
        ...row,
        genero: generoValue
      })));
    }
  }, [userData, user, userLoading]);

  // Update cell value - Handling servicios dinámicos
  const updateCell = useCallback((rowIndex, field, value) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex] = { ...newRows[rowIndex], [field]: value };
      
      // Recalculate totals if it's a service or subtotal change
      if (field === 'servicios' || field === 'subtotal') {
        const { subtotal, total } = calculateRowTotals(newRows[rowIndex]);
        newRows[rowIndex].subtotal = subtotal;
        newRows[rowIndex].total = total;
      }
      
      return newRows;
    });
  }, [calculateRowTotals]);

  // Manejar cambio de servicios dinámicos
  const handleServicesChange = useCallback((rowIndex, newServices) => {
    updateCell(rowIndex, 'servicios', newServices);
  }, [updateCell]);

  // Add new row
  const addRow = useCallback(() => {
    const newRow = createEmptyRow();
    
    // Aplicar la misma lógica de genero que en useEffect
    if (userData?.nombre_completo) {
      newRow.genero = userData.nombre_completo;
    } else if (user?.email) {
      newRow.genero = user.email.split('@')[0].replace(/[._-]/g, ' ').toUpperCase();
    } else {
      newRow.genero = 'Usuario Sistema';
    }
    
    setRows(prev => [...prev, newRow]);
  }, [userData, user]);

  // Remove row
  const removeRow = useCallback((index) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter((_, i) => i !== index));
    }
  }, [rows.length]);

  // Save all rows to Firestore
  const saveAllRows = useCallback(async () => {
    try {
      const validRows = rows.filter(row => 
        row.remision && 
        row.movil && 
        row.no_orden && 
        row.servicios && 
        row.servicios.some(s => {
          if (typeof s === 'string') return s.trim() !== '';
          if (typeof s === 'object' && s !== null) return s.título && s.título.trim() !== '';
          return false;
        })
      );

      if (validRows.length === 0) {
        showNotification('Por favor complete al menos una remisión con datos válidos', 'error');
        return;
      }

      const remisionesData = validRows.map(row => {
        const data = {
          ...row,
          estado: 'IMPRESO', // Cambiar el estado por defecto a IMPRESO
          genero: user?.email || 'usuario@email.com',
          fecha_creacion: new Date(),
          // Procesar servicios: mantener estructura con id y título
          servicios: (row.servicios || [])
            .filter(s => {
              if (typeof s === 'string') return s.trim() !== '';
              if (typeof s === 'object' && s !== null) return s.título && s.título.trim() !== '';
              return false;
            })
            .map(s => {
              if (typeof s === 'string') return { título: s };
              return { id_servicio: s.id_servicio, título: s.título };
            }),
          // Eliminar propiedades de React
          id: undefined
        };

        return data;
      });

      await saveMultipleRemisiones(remisionesData);
      showNotification(`${validRows.length} remisiones guardadas exitosamente`, 'success');
      
    } catch (error) {
      console.error('Error saving rows:', error);
      showNotification(error.message || 'Error al guardar remisiones', 'error');
    }
  }, [rows, user?.email, saveMultipleRemisiones]);

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Validate row before operations
  const isRowValid = (row) => {
    return row.remision && row.movil && row.servicio1 && row.fecha_remision;
  };

  if (loading) {
    return (
      <div className="spreadsheet-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="loading-spinner"
        />
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="remisiones-spreadsheet remisiones-consolidado"
    >
      {/* Header */}
      <div className="spreadsheet-header">
        <div className="header-content">
          <h1>📊 Remisiones Consolidado - Vista Hoja de Cálculo</h1>
          <p>Ingrese remisiones con adjuntos, informes técnicos y generación de PDF consolidado</p>
        </div>
        <div className="header-actions">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addRow}
            className="btn btn-secondary"
            disabled={saving}
          >
            ➕ Agregar Fila
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={saveAllRows}
            className="btn btn-primary"
            disabled={saving || rows.length === 0}
          >
            {saving ? '💾 Guardando...' : '💾 Guardar Remisiones'}
          </motion.button>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="spreadsheet-container">
        <div className="spreadsheet-scroll">
          <table className="spreadsheet-table">
            <thead>
              <tr>
                <th className="row-number-header">#</th>
                <th>Remisión</th>
                <th>Móvil</th>
                <th>N° Orden</th>
                <th>Estado</th>
                <th className="services-header">Servicios</th>
                <th>Fecha Remisión</th>
                <th>Fecha Máximo</th>
                <th>Fecha BIT Prof</th>
                <th>Radicación</th>
                <th>N° ID BIT</th>
                <th>N° Fact Elect</th>
                <th>Subtotal</th>
                <th>Total</th>
                <th>UNE</th>
                <th>Carrocería</th>
                <th>Autorizó</th>
                <th>Técnico 1</th>
                <th>Técnico 2</th>
                <th>Técnico 3</th>
                <th>Generó</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {rows.map((row, rowIndex) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className={!isRowValid(row) ? 'row-invalid' : ''}
                  >
                    {/* Row number */}
                    <td className="row-number">{rowIndex + 1}</td>
                    
                    {/* Remision */}
                    <td>
                      <input
                        type="text"
                        value={row.remision}
                        onChange={(e) => updateCell(rowIndex, 'remision', e.target.value)}
                        className="cell-input"
                        placeholder="1001 o REM-1001"
                      />
                    </td>
                    
                    {/* Movil */}
                    <td>
                      <input
                        type="text"
                        value={row.movil}
                        onChange={(e) => updateCell(rowIndex, 'movil', e.target.value)}
                        className="cell-input"
                        placeholder="7777 o BO-0177"
                      />
                    </td>
                    
                    {/* No Orden */}
                    <td>
                      <input
                        type="text"
                        value={row.no_orden}
                        onChange={(e) => updateCell(rowIndex, 'no_orden', e.target.value)}
                        className="cell-input"
                        placeholder="JU777777"
                      />
                    </td>
                    
                    {/* Estado */}
                    <td>
                      <select
                        value={row.estado}
                        onChange={(e) => updateCell(rowIndex, 'estado', e.target.value)}
                        className="cell-select"
                      >
                        {ESTADOS_REMISION.map(estado => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </td>
                    
                    {/* Servicios Dinámicos */}
                    <td className="services-cell">
                      <DynamicServices
                        services={row.servicios || ['']}
                        onChange={(services) => handleServicesChange(rowIndex, services)}
                      />
                    </td>
                    
                    {/* Fechas */}
                    {['fecha_remision', 'fecha_maximo', 'fecha_bit_prof', 'radicacion'].map(field => (
                      <td key={field}>
                        <input
                          type="date"
                          value={row[field] instanceof Date ? 
                            row[field].toISOString().split('T')[0] : 
                            row[field]
                          }
                          onChange={(e) => updateCell(rowIndex, field, e.target.value)}
                          className="cell-input cell-date"
                        />
                      </td>
                    ))}
                    
                    {/* No ID BIT */}
                    <td>
                      <input
                        type="number"
                        value={row.no_id_bit}
                        onChange={(e) => updateCell(rowIndex, 'no_id_bit', parseInt(e.target.value) || 0)}
                        className="cell-input"
                        placeholder="123375"
                      />
                    </td>
                    
                    {/* No Fact Elect */}
                    <td>
                      <input
                        type="text"
                        value={row.no_fact_elect}
                        onChange={(e) => updateCell(rowIndex, 'no_fact_elect', e.target.value)}
                        className="cell-input"
                        placeholder="FE123"
                      />
                    </td>
                    
                    {/* Subtotal */}
                    <td className="subtotal-cell">
                      <input
                        type="number"
                        value={row.subtotal}
                        onChange={(e) => updateCell(rowIndex, 'subtotal', parseFloat(e.target.value) || 0)}
                        className="cell-input cell-currency subtotal-input"
                        placeholder="0"
                      />
                      <span className="currency-display">{formatCurrency(row.subtotal)}</span>
                    </td>
                    
                    {/* Total */}
                    <td>
                      <span className="currency-display total-display">
                        {formatCurrency(row.total)}
                      </span>
                    </td>
                    
                    {/* UNE */}
                    <td>
                      <select
                        value={row.une}
                        onChange={(e) => updateCell(rowIndex, 'une', e.target.value)}
                        className="cell-select"
                      >
                        <option value="">-- Seleccionar --</option>
                        {UNE_OPTIONS.map(une => (
                          <option key={une} value={une}>
                            {une}
                          </option>
                        ))}
                      </select>
                    </td>
                    
                    {/* Carroceria */}
                    <td>
                      <input
                        type="text"
                        value={row.carroceria}
                        onChange={(e) => updateCell(rowIndex, 'carroceria', e.target.value)}
                        className="cell-input"
                        placeholder="Tipo carrocería"
                      />
                    </td>
                    
                    {/* Autorizo */}
                    <td>
                      <input
                        type="text"
                        value={row.autorizo}
                        onChange={(e) => updateCell(rowIndex, 'autorizo', e.target.value)}
                        className="cell-input"
                        placeholder="Quien autorizó"
                      />
                    </td>
                    
                    {/* Tecnicos 1-3 */}
                    {[1, 2, 3].map(num => (
                      <td key={`tecnico${num}`}>
                        <select
                          value={row[`tecnico${num}`]}
                          onChange={(e) => updateCell(rowIndex, `tecnico${num}`, e.target.value)}
                          className="cell-select"
                        >
                          <option value="">-- Seleccionar --</option>
                          {empleadosForSelect.map(empleado => (
                            <option key={empleado.value} value={empleado.value}>
                              {empleado.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    ))}
                    
                    {/* Genero */}
                    <td>
                      <div className="readonly-cell">
                        <span className="genero-display">{row.genero || 'Cargando...'}</span>
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td className="actions-cell">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeRow(rowIndex)}
                        className="btn-delete-row"
                        disabled={rows.length === 1}
                        title="Eliminar fila"
                      >
                        🗑️
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`notification notification-${notification.type}`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RemisionesSpreadsheet;