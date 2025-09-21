/**
 * 📊 REMISIONES CONSOLIDADO SPREADSHEET - Google Sheets Style Interface
 * =====================================================================
 * Interfaz tipo hoja de cálculo para ingreso masivo de remisiones con funcionalidad
 * de adjuntos, informes técnicos y generación de PDF consolidado
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
} from '../../ingresar-trabajo/hooks/useFirestoreHooks';
import ServicioSelect from '../../ingresar-trabajo/components/ServicioSelect';
import AdjuntosUploader from './AdjuntosUploader';
import ModalInformeTecnico from './ModalInformeTecnico';
import { useRemisionesConsolidado } from '../hooks/useRemisionesConsolidado';
import { useInformeConsolidado } from '../hooks/useInformeConsolidado';
import { generateConsolidatedPDF } from '../lib/pdfMerge';
import './RemisionesSpreadsheet.css';
import '../styles/RemisionesConsolidado.css';

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
  remision: '', // string - permite formato libre como "1262" o "REM-1262"
  movil: '', // string - permite formato libre como "7777" o "BO-0177"
  no_orden: '', // string
  estado: 'GENERADO', // string - por defecto GENERADO
  servicio1: '', // string - vacío por defecto para evitar warnings de React
  servicio2: '', // string - vacío por defecto para evitar warnings de React
  servicio3: '', // string - vacío por defecto para evitar warnings de React
  servicio4: '', // string - vacío por defecto para evitar warnings de React
  servicio5: '', // string - vacío por defecto para evitar warnings de React
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
  // Nuevos campos para consolidado
  adjuntos: {
    orden_url: null,
    remision_url: null
  },
  informe_status: 'pendiente', // 'pendiente', 'creado', 'consolidado'
  consolidado_url: null,
  consolidado_creado_en: null,
  consolidado_creado_por: null
});

const RemisionesSpreadsheet = () => {
  // State management
  const [rows, setRows] = useState([createEmptyRow()]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [notification, setNotification] = useState(null);
  const [modalInforme, setModalInforme] = useState({ open: false, rowIndex: null });
  const [generatingPDF, setGeneratingPDF] = useState({});
  
  const { user } = useAuth();
  
  // Custom hooks
  const { servicios, serviciosForSelect, loading: serviciosLoading, getCostoByTitulo } = useServicios();
  const { empleados, empleadosForSelect, loading: empleadosLoading } = useEmpleados();
  const { userData, loading: userLoading } = useCurrentUser(user?.email);
  const { saveMultipleRemisiones, saving, error: saveError } = useRemisionSaver();
  const { calculateRowTotals } = useCalculateTotals(getCostoByTitulo);
  const { 
    saveRemisionConsolidado, 
    uploadAdjuntos, 
    checkRemisionExists 
  } = useRemisionesConsolidado();

  const {
    createInformeTecnico
  } = useInformeConsolidado();
  
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

  // Save all rows to Firestore - Enhanced for consolidado
  const saveAllRows = useCallback(async () => {
    try {
      const savedRemisiones = await saveRemisionConsolidado(rows, user?.email);
      showNotification('Remisiones guardadas exitosamente', 'success');
      
      // Update rows with saved IDs for further operations
      setRows(prev => prev.map((row, index) => ({
        ...row,
        firestoreId: savedRemisiones[index]?.id || row.firestoreId
      })));
      
    } catch (error) {
      console.error('Error saving rows:', error);
      showNotification(error.message || 'Error al guardar remisiones', 'error');
    }
  }, [rows, user?.email, saveRemisionConsolidado]);

  // Handle file uploads for adjuntos
  const handleAdjuntosUpload = useCallback(async (rowIndex, files) => {
    try {
      const row = rows[rowIndex];
      if (!row.firestoreId) {
        showNotification('Debe guardar la remisión antes de subir adjuntos', 'error');
        return;
      }

      const urls = await uploadAdjuntos(row.firestoreId, files);
      
      setRows(prev => {
        const newRows = [...prev];
        newRows[rowIndex] = {
          ...newRows[rowIndex],
          adjuntos: {
            ...newRows[rowIndex].adjuntos,
            ...urls
          }
        };
        return newRows;
      });

      showNotification('Adjuntos subidos exitosamente', 'success');
    } catch (error) {
      console.error('Error uploading adjuntos:', error);
      showNotification('Error al subir adjuntos', 'error');
    }
  }, [rows, uploadAdjuntos]);

  // Open informe modal
  const openInformeModal = useCallback((rowIndex) => {
    const row = rows[rowIndex];
    if (!row.firestoreId) {
      showNotification('Debe guardar la remisión antes de crear el informe', 'error');
      return;
    }
    setModalInforme({ open: true, rowIndex });
  }, [rows]);

  // Handle informe creation
  const handleInformeCreation = useCallback(async (informeData) => {
    try {
      const { rowIndex } = modalInforme;
      const row = rows[rowIndex];
      
      const informeId = await createInformeTecnico(row.firestoreId, informeData, user?.email);
      
      setRows(prev => {
        const newRows = [...prev];
        newRows[rowIndex] = {
          ...newRows[rowIndex],
          informe_status: 'creado',
          informeId: informeId
        };
        return newRows;
      });

      setModalInforme({ open: false, rowIndex: null });
      showNotification('Informe técnico creado exitosamente', 'success');
    } catch (error) {
      console.error('Error creating informe:', error);
      showNotification('Error al crear informe técnico', 'error');
    }
  }, [modalInforme, rows, createInformeTecnico, user?.email]);

  // Generate consolidated PDF
  const generateConsolidatedPDFForRow = useCallback(async (rowIndex) => {
    try {
      const row = rows[rowIndex];
      
      if (!row.firestoreId) {
        showNotification('Debe guardar la remisión antes de generar el consolidado', 'error');
        return;
      }

      if (!row.no_orden || !row.movil) {
        showNotification('No. de Orden y Móvil son requeridos para generar el consolidado', 'error');
        return;
      }

      setGeneratingPDF(prev => ({ ...prev, [rowIndex]: true }));

      const consolidadoUrl = await generateConsolidatedPDF({
        remisionId: row.firestoreId,
        remisionData: row,
        userEmail: user?.email
      });

      setRows(prev => {
        const newRows = [...prev];
        newRows[rowIndex] = {
          ...newRows[rowIndex],
          consolidado_url: consolidadoUrl,
          consolidado_creado_en: new Date(),
          consolidado_creado_por: user?.email,
          informe_status: 'consolidado'
        };
        return newRows;
      });

      showNotification('PDF consolidado generado exitosamente', 'success');
      
      // Open download link
      window.open(consolidadoUrl, '_blank');

    } catch (error) {
      console.error('Error generating consolidated PDF:', error);
      showNotification('Error al generar PDF consolidado', 'error');
    } finally {
      setGeneratingPDF(prev => ({ ...prev, [rowIndex]: false }));
    }
  }, [rows, user?.email]);

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
                <th>Adjuntos</th>
                <th>Informe</th>
                <th>Consolidado</th>
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

                    {/* Adjuntos Column */}
                    <td className="adjuntos-cell">
                      <AdjuntosUploader
                        row={row}
                        rowIndex={rowIndex}
                        onUpload={handleAdjuntosUpload}
                        disabled={!row.firestoreId}
                      />
                    </td>

                    {/* Informe Column */}
                    <td className="informe-cell">
                      <div className="informe-actions">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openInformeModal(rowIndex)}
                          className={`btn-informe ${row.informe_status}`}
                          disabled={!row.firestoreId}
                          title={`Estado: ${row.informe_status}`}
                        >
                          {row.informe_status === 'pendiente' ? '📝 Crear' : 
                           row.informe_status === 'creado' ? '✅ Creado' : '📋 Consolidado'}
                        </motion.button>
                      </div>
                    </td>

                    {/* Consolidado Column */}
                    <td className="consolidado-cell">
                      <div className="consolidado-actions">
                        {row.consolidado_url ? (
                          <div className="consolidado-ready">
                            <a 
                              href={row.consolidado_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn-download-consolidado"
                            >
                              📄 Descargar
                            </a>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => generateConsolidatedPDFForRow(rowIndex)}
                              className="btn-regenerate"
                              disabled={generatingPDF[rowIndex]}
                              title="Regenerar consolidado"
                            >
                              🔄
                            </motion.button>
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => generateConsolidatedPDFForRow(rowIndex)}
                            className="btn-generate-consolidado"
                            disabled={!row.firestoreId || generatingPDF[rowIndex]}
                          >
                            {generatingPDF[rowIndex] ? '⏳ Generando...' : '📄 Generar PDF'}
                          </motion.button>
                        )}
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

      {/* Modal Informe Técnico */}
      <ModalInformeTecnico
        isOpen={modalInforme.open}
        onClose={() => setModalInforme({ open: false, rowIndex: null })}
        onSave={handleInformeCreation}
        remisionData={modalInforme.rowIndex !== null ? rows[modalInforme.rowIndex] : null}
      />

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