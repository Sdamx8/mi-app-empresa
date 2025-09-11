import React, { useState } from 'react';

const categorias = ['Instalación', 'Mantenimiento', 'Reparación', 'Otro'];
const estados = ['pendiente', 'proceso', 'finalizado', 'entregado'];

const FiltrosServicios = ({ onChange }) => {
  const [filtros, setFiltros] = useState({ texto: '', categoria: '', estado: '' });

  const handleChange = e => {
    const { name, value } = e.target;
    const nuevosFiltros = { ...filtros, [name]: value };
    setFiltros(nuevosFiltros);
    onChange(nuevosFiltros);
  };

  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
      <input
        name="texto"
        placeholder="Buscar por ID o título"
        value={filtros.texto}
        onChange={handleChange}
        style={{ border: '1px solid #BDC3C7', borderRadius: 8, padding: 8, fontFamily: 'Poppins, Roboto, sans-serif', fontSize: 14, color: '#2C3E50', outline: 'none', minWidth: 180 }}
      />
      <select name="categoria" value={filtros.categoria} onChange={handleChange} style={{ border: '1px solid #BDC3C7', borderRadius: 8, padding: 8, fontFamily: 'Poppins, Roboto, sans-serif', fontSize: 14, color: '#2C3E50', outline: 'none' }}>
        <option value="">Todas las categorías</option>
        {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
      </select>
      <select name="estado" value={filtros.estado} onChange={handleChange} style={{ border: '1px solid #BDC3C7', borderRadius: 8, padding: 8, fontFamily: 'Poppins, Roboto, sans-serif', fontSize: 14, color: '#2C3E50', outline: 'none' }}>
        <option value="">Todos los estados</option>
        {estados.map(est => <option key={est} value={est}>{est.charAt(0).toUpperCase() + est.slice(1)}</option>)}
      </select>
    </div>
  );
};

export default FiltrosServicios;
