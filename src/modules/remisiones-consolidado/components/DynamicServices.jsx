import React, { useState, useEffect, useCallback } from "react";
import ServiceAutocomplete from "./ServiceAutocomplete";
import "./DynamicServices.css";

const DynamicServices = ({ services = [], onChange, onSubtotalChange }) => {
  const [serviceList, setServiceList] = useState(services.length > 0 ? services : [""]);

  // 🔹 Calcular subtotal basado en los servicios
  const calculateSubtotal = useCallback((servicesList) => {
    return servicesList.reduce((total, service) => {
      if (typeof service === 'object' && service !== null && service.costo) {
        return total + (parseFloat(service.costo) || 0);
      }
      return total;
    }, 0);
  }, []);

  // 🔹 Sincronizar con props cuando cambien externamente
  useEffect(() => {
    if (services.length > 0 && JSON.stringify(services) !== JSON.stringify(serviceList)) {
      setServiceList(services);
    }
  }, [services, serviceList]);

  // 🔹 Agregar una nueva columna de servicio
  const handleAddService = useCallback(() => {
    const updated = [...serviceList, ""];
    setServiceList(updated);
    onChange(updated);
    
    // Actualizar subtotal
    const newSubtotal = calculateSubtotal(updated);
    if (onSubtotalChange) {
      onSubtotalChange(newSubtotal);
    }
  }, [serviceList, onChange, calculateSubtotal, onSubtotalChange]);

  // 🔹 Eliminar una columna de servicio  
  const handleRemoveService = useCallback((index) => {
    if (serviceList.length <= 1) return; // Mantener al menos un servicio
    
    const updated = serviceList.filter((_, i) => i !== index);
    setServiceList(updated);
    onChange(updated);
    
    // Actualizar subtotal (resetear a 0 si no hay servicios válidos)
    const newSubtotal = calculateSubtotal(updated);
    if (onSubtotalChange) {
      onSubtotalChange(newSubtotal);
    }
  }, [serviceList, onChange, calculateSubtotal, onSubtotalChange]);

  // 🔹 Actualizar el valor de un servicio en su posición
  const handleServiceChange = useCallback((index, serviceData) => {
    const updated = [...serviceList];
    // serviceData puede ser { id_servicio, título, costo } o solo un string
    updated[index] = serviceData;
    setServiceList(updated);
    onChange(updated);
    
    // Actualizar subtotal automáticamente
    const newSubtotal = calculateSubtotal(updated);
    if (onSubtotalChange) {
      onSubtotalChange(newSubtotal);
    }
  }, [serviceList, onChange, calculateSubtotal, onSubtotalChange]);

  // 🔹 Calcular subtotal actual para mostrar
  const currentSubtotal = calculateSubtotal(serviceList);

  return (
    <div className="dynamic-services-container">
      {serviceList.map((service, index) => (
        <div key={index} className="service-row">
          <div className="service-input-container">
            <ServiceAutocomplete
              value={typeof service === 'object' ? service.título : service}
              onChange={(serviceData) => handleServiceChange(index, serviceData)}
            />
          </div>
          {serviceList.length > 1 && (
            <button
              type="button"
              className="service-remove-btn"
              onClick={() => handleRemoveService(index)}
              title="Eliminar servicio"
            >
              ✖
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        className="service-add-btn"
        onClick={handleAddService}
      >
        ➕ Agregar
      </button>
      
      {/* Mostrar subtotal si hay servicios con costo */}
      {currentSubtotal > 0 && (
        <div className="services-subtotal-display">
          Subtotal: ${new Intl.NumberFormat('es-CO').format(currentSubtotal)}
        </div>
      )}
    </div>
  );
};

export default DynamicServices;