import React, { useState, useEffect } from "react";
import ServiceAutocomplete from "./ServiceAutocomplete";
import "./DynamicServices.css";

const DynamicServices = ({ services = [], onChange }) => {
  const [serviceList, setServiceList] = useState(services.length > 0 ? services : [""]);

  // 🔹 Sincronizar con props cuando cambien externamente
  useEffect(() => {
    if (services.length > 0 && JSON.stringify(services) !== JSON.stringify(serviceList)) {
      setServiceList(services);
    }
  }, [services]);

  // 🔹 Agregar una nueva columna de servicio
  const handleAddService = () => {
    const updated = [...serviceList, ""];
    setServiceList(updated);
    onChange(updated);
  };

  // 🔹 Eliminar una columna de servicio
  const handleRemoveService = (index) => {
    const updated = serviceList.filter((_, i) => i !== index);
    setServiceList(updated);
    onChange(updated);
  };

  // 🔹 Actualizar el valor de un servicio en su posición
  const handleServiceChange = (index, serviceData) => {
    const updated = [...serviceList];
    // serviceData puede ser { id_servicio, título } o solo un string
    updated[index] = serviceData;
    setServiceList(updated);
    onChange(updated);
  };

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
        ➕ Agregar Servicio
      </button>
    </div>
  );
};

export default DynamicServices;