import React, { useState, useEffect, useCallback } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import "./ServiceAutocomplete.css";

const ServiceAutocomplete = ({ value, onChange }) => {
  const [services, setServices] = useState([]);
  const [inputValue, setInputValue] = useState(value || "");
  const [filtered, setFiltered] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // 🔹 Cargar servicios en tiempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "servicios"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setServices(data);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Sincronizar inputValue con value prop
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // 🔹 Función de filtrado por título
  const filterServices = useCallback(
    (query) => {
      if (!query || !query.trim()) return [];
      return services
        .filter((s) =>
          (s?.título || "").toLowerCase().includes(query.toLowerCase())
        );
    },
    [services]
  );

  // 🔹 Filtrar en base al input (sin límite máximo)
  useEffect(() => {
    const trimmedInput = inputValue.trim();
    if (trimmedInput === "") {
      setFiltered([]);
      setIsDropdownVisible(false);
    } else {
      const results = filterServices(trimmedInput);
      setFiltered(results); // Sin límite máximo
      setIsDropdownVisible(true);
    }
  }, [inputValue, filterServices]);

  // 🔹 Manejar cambio en el input
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  };

  // 🔹 Seleccionar un servicio
  const handleServiceSelect = (service) => {
    const serviceData = {
      id_servicio: service.id,
      título: service.título,
      costo: service.costo || 0
    };
    
    setInputValue(service.título);
    setIsDropdownVisible(false);
    setFiltered([]);
    onChange(serviceData); // Enviar id, título y costo
  };

  // 🔹 Manejar blur del input
  const handleInputBlur = () => {
    // Delay más corto para permitir clicks en la lista
    setTimeout(() => {
      setIsDropdownVisible(false);
    }, 150);
  };

  // 🔹 Manejar focus del input
  const handleInputFocus = () => {
    if (inputValue.trim() && filtered.length > 0) {
      setIsDropdownVisible(true);
    }
  };

  return (
    <div className="service-autocomplete-container">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder="Buscar servicio..."
        className="service-autocomplete-input"
      />

      {isDropdownVisible && (
        <div className="service-autocomplete-dropdown">
          {filtered.length > 0 ? (
            <ul className="service-autocomplete-list">
              {filtered.map((service) => (
                <li
                  key={service.id}
                  className="service-autocomplete-item"
                  onMouseDown={(e) => e.preventDefault()} // Prevenir blur
                  onClick={() => handleServiceSelect(service)}
                >
                  <div className="service-item-content">
                    <span 
                      className="service-title" 
                      title={service.título}
                      style={{
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        maxWidth: '280px',
                        lineHeight: '1.3'
                      }}
                    >
                      {service.título}
                    </span>
                    {service.costo && !isNaN(service.costo) && (
                      <span className="service-cost">
                        ${new Intl.NumberFormat('es-CO').format(Number(service.costo))}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="service-autocomplete-no-results">
              No se encontraron servicios
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceAutocomplete;