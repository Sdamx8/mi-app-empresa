/**
 * 📊 REMISIONES SPREADSHEET - Google Sheets Style Interface
 * ========================================================
 * Interfaz tipo hoja de cálculo para ingreso masivo de remisiones
 * Características: edición inline, dropdowns conectados a Firestore, cálculos automáticos
 * 
 * @author: Global Mobility Solutions
 * @version: 1.0.0
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
} from '../hooks/useFirestoreHooks';
import ServicioSelect from './ServicioSelect';
import './RemisionesSpreadsheet.css';

// Estados disponibles para remisiones
const ESTADOS_REMISION = [
  'CANCELADO',
  'GARANTIA', 
  'CORTESIA',
  'GENERADO',
  'PENDIENTE',
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
  remision: 0, // number
  movil: 0, // number 
  no_orden: '', // string
  estado: 'PENDIENTE', // string
  servicio1: null, // string | null
  servicio2: null, // string | null
  servicio3: null, // string | null
  servicio4: null, // string | null
  servicio5: null, // string | null
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
  tecnico1: null, // string | null
  tecnico2: null, // string | null
  tecnico3: null, // string | null
  genero: '' // string
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
    if (userData?.nombre_completo) {
      setRows(prev => prev.map(row => ({
        ...row,
        genero: userData.nombre_completo
      })));
    }
  }, [userData]);

  // Update cell value - Handling both direct calls and ServicioSelect calls
  const updateCell = useCallback((rowIndexOrField, fieldOrValue, value) => {
    let rowIndex, field, newValue;
    
    // Handle calls from ServicioSelect (field, value) vs direct calls (rowIndex, field, value)
    if (typeof rowIndexOrField === 'string') {
      // Called from ServicioSelect: updateCell(field, value)
      // We need to find which row we're updating - this will be handled by a closure
      return;
    } else {
      // Direct call: updateCell(rowIndex, field, value)
      rowIndex = rowIndexOrField;
      field = fieldOrValue;
      newValue = value;
    }
    
    setRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex] = { ...newRows[rowIndex], [field]: newValue };
      
      // Recalculate totals if it's a service or subtotal change
      if (field.startsWith('servicio') || field === 'subtotal') {
        const { subtotal, total } = calculateRowTotals(newRows[rowIndex]);
        newRows[rowIndex].subtotal = subtotal;
        newRows[rowIndex].total = total;
      }
      
      return newRows;
    });
  }, [calculateRowTotals]);

  // Create a specific handler for ServicioSelect
  const handleServicioChange = useCallback((rowIndex, field, value) => {
    updateCell(rowIndex, field, value);
  }, [updateCell]);

  // Add new row
  const addRow = useCallback(() => {
    const newRow = createEmptyRow();
    // Copy genero from existing row if available
    if (userData?.nombre_completo) {
      newRow.genero = userData.nombre_completo;
    }
    setRows(prev => [...prev, newRow]);
  }, [userData]);

  // Remove row
  const removeRow = useCallback((index) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter((_, i) => i !== index));
    }
  }, [rows.length]);

  // Save all rows to Firestore
  const saveAllRows = useCallback(async () => {
    try {
      await saveMultipleRemisiones(rows, user?.email);
      showNotification('Remisiones guardadas exitosamente', 'success');
      
      // Reset to one empty row
      const newRow = createEmptyRow();
      if (userData?.nombre_completo) {
        newRow.genero = userData.nombre_completo;
      }
      setRows([newRow]);
      
    } catch (error) {
      console.error('Error saving rows:', error);
      showNotification(error.message || 'Error al guardar remisiones', 'error');
    }
  }, [rows, user?.email, userData, saveMultipleRemisiones]);

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
      className="remisiones-spreadsheet"
    >
      {/* Header */}
      <div className="spreadsheet-header">
        <div className="header-content">
          <h1>📊 Ingresar Trabajos - Vista Hoja de Cálculo</h1>
          <p>Ingrese múltiples remisiones de forma rápida y eficiente</p>
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
                <th>Servicio 1</th>
                <th>Servicio 2</th>
                <th>Servicio 3</th>
                <th>Servicio 4</th>
                <th>Servicio 5</th>
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
                  >
                    {/* Row number */}
                    <td className="row-number">{rowIndex + 1}</td>
                    
                    {/* Remision */}
                    <td>
                      <input
                        type="number"
                        value={row.remision}
                        onChange={(e) => updateCell(rowIndex, 'remision', parseInt(e.target.value) || 0)}
                        className="cell-input"
                        placeholder="1001"
                      />
                    </td>
                    
                    {/* Movil */}
                    <td>
                      <input
                        type="number"
                        value={row.movil}
                        onChange={(e) => updateCell(rowIndex, 'movil', parseInt(e.target.value) || 0)}
                        className="cell-input"
                        placeholder="7064"
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
                    
                    {/* Servicios 1-5 */}
                    {[1, 2, 3, 4, 5].map(num => (
                      <td key={`servicio${num}`}>
                        <ServicioSelect
                          value={row[`servicio${num}`]}
                          onChange={(field, value) => handleServicioChange(rowIndex, field, value)}
                          servicios={serviciosForSelect}
                          name={`servicio${num}`}
                          placeholder={`-- Servicio ${num} --`}
                          showCost={false} // Solo mostrar títulos, no costos
                        />
                      </td>
                    ))}
                    
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
                    <td>
                      <input
                        type="number"
                        value={row.subtotal}
                        onChange={(e) => updateCell(rowIndex, 'subtotal', parseFloat(e.target.value) || 0)}
                        className="cell-input cell-currency"
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
                      <span className="readonly-cell">{row.genero}</span>
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