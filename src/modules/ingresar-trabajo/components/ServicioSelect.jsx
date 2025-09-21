/**
 * 🔧 SERVICIO SELECT COMPONENT
 * ===========================
 * Componente reutilizable para seleccionar servicios desde Firestore
 * Muestra el título del servicio y guarda el id_servicio
 * 
 * @author: Global Mobility Solutions
 * @version: 1.0.0
 * @date: September 2025
 */

import React from 'react';
import { THEME } from '../../../shared/tokens/theme';

const ServicioSelect = ({ 
  value, 
  onChange, 
  servicios = [], 
  name, 
  placeholder = "-- Seleccionar Servicio --",
  className = "",
  disabled = false,
  showCost = false 
}) => {
  
  const handleChange = (e) => {
    const selectedValue = e.target.value;
    onChange(name, selectedValue);
  };

  // Función para truncar texto largo
  const truncateText = (text, maxLength = 40) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <select
      className={`cell-select servicio-select ${className}`}
      value={value || ""}
      onChange={handleChange}
      disabled={disabled}
      title={servicios.find(s => s.value === value)?.label || placeholder}
    >
      <option value="">{placeholder}</option>
      {servicios.map((servicio) => (
        <option 
          key={servicio.key || servicio.id_servicio || servicio.value} 
          value={servicio.value}
          title={`${servicio.label} ${showCost && servicio.costo ? `- ${formatCurrency(servicio.costo)}` : ''}`}
        >
          {truncateText(servicio.label)} {showCost && servicio.costo ? `- ${formatCurrency(servicio.costo)}` : ''}
        </option>
      ))}
    </select>
  );
};

export default ServicioSelect;