import React, { useState } from 'react';

const categorias = ['Instalación', 'Mantenimiento', 'Reparación', 'Otro'];

const FiltrosServicios = ({ onChange }) => {
  const [filtros, setFiltros] = useState({ texto: '', categoria: '' });

  const handleChange = e => {
    const { name, value } = e.target;
    const nuevosFiltros = { ...filtros, [name]: value };
    setFiltros(nuevosFiltros);
    onChange(nuevosFiltros);
  };

  return (
    <div className="filters-grid">
      <div className="filter-group">
        <label htmlFor="busqueda">🔍 Buscar Servicios</label>
        <input
          id="busqueda"
          name="texto"
          placeholder="Buscar por ID o título del servicio"
          value={filtros.texto}
          onChange={handleChange}
        />
      </div>
      <div className="filter-group">
        <label htmlFor="categoria">📂 Categoría</label>
        <select 
          id="categoria"
          name="categoria" 
          value={filtros.categoria} 
          onChange={handleChange}
        >
          <option value="">Todas las categorías</option>
          {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
    </div>
  );
};

export default FiltrosServicios;
