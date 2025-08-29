import React, { useState, useMemo } from 'react';
import CorporateLogo from './CorporateLogo';
import './App.css';

// Datos de ejemplo para el CRM
const initialClients = [
  {
    id: 1,
    nombre: 'Ana García',
    empresa: 'Tech Solutions',
    email: 'ana@techsolutions.com',
    telefono: '+34 600 123 456',
    estado: 'Activo',
    fechaUltimoContacto: '2024-12-15'
  },
  {
    id: 2,
    nombre: 'Carlos Rodríguez',
    empresa: 'Marketing Pro',
    email: 'carlos@marketingpro.com',
    telefono: '+34 610 234 567',
    estado: 'Inactivo',
    fechaUltimoContacto: '2024-11-20'
  },
  {
    id: 3,
    nombre: 'María López',
    empresa: 'Diseño Creativo',
    email: 'maria@disenocreativo.com',
    telefono: '+34 620 345 678',
    estado: 'Activo',
    fechaUltimoContacto: '2024-12-10'
  },
  {
    id: 4,
    nombre: 'Pedro Martín',
    empresa: 'Consultoría Legal',
    email: 'pedro@consultorialegal.com',
    telefono: '+34 630 456 789',
    estado: 'Prospecto',
    fechaUltimoContacto: '2024-12-05'
  },
  {
    id: 5,
    nombre: 'Laura Sánchez',
    empresa: 'E-commerce Plus',
    email: 'laura@ecommerceplus.com',
    telefono: '+34 640 567 890',
    estado: 'Activo',
    fechaUltimoContacto: '2024-12-12'
  }
];

const CRM = () => {
  const [clients, setClients] = useState(initialClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    estado: 'Prospecto',
    fechaUltimoContacto: new Date().toISOString().split('T')[0]
  });

  const itemsPerPage = 5;

  // Filtrar y buscar clientes
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = 
        client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'Todos' || client.estado === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  // Paginación
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // Métricas del dashboard
  const metrics = useMemo(() => {
    return {
      total: clients.length,
      activos: clients.filter(c => c.estado === 'Activo').length,
      inactivos: clients.filter(c => c.estado === 'Inactivo').length,
      prospectos: clients.filter(c => c.estado === 'Prospecto').length
    };
  }, [clients]);

  // Manejar formulario
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingClient) {
      // Editar cliente existente
      setClients(clients.map(client => 
        client.id === editingClient.id 
          ? { ...formData, id: editingClient.id }
          : client
      ));
    } else {
      // Agregar nuevo cliente
      const newClient = {
        ...formData,
        id: Math.max(...clients.map(c => c.id)) + 1
      };
      setClients([...clients, newClient]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      empresa: '',
      email: '',
      telefono: '',
      estado: 'Prospecto',
      fechaUltimoContacto: new Date().toISOString().split('T')[0]
    });
    setEditingClient(null);
    setShowModal(false);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData(client);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      setClients(clients.filter(client => client.id !== id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Activo': return 'bg-green-100 text-green-800';
      case 'Inactivo': return 'bg-red-100 text-red-800';
      case 'Prospecto': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header with Corporate Logo */}
        <div className="mb-8 slide-in-left">
          <div className="flex items-center justify-between mb-6">
            <CorporateLogo size="medium" showText={true} className="bounce-in" />
            <div className="text-right">
              <div className="text-sm text-gray-500">Última actualización</div>
              <div className="text-sm font-semibold text-gray-700">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 typing-animation">
            CRM - Gestión de Clientes
          </h1>
          <p className="text-gray-600">Administra tu cartera de clientes de forma eficiente</p>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 slide-in-right">
          <div className="modern-card hover-scale p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg floating">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold gradient-text">{metrics.total}</p>
              </div>
            </div>
          </div>

          <div className="modern-card hover-scale p-6" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg floating" style={{animationDelay: '0.5s'}}>
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                <p className="text-2xl font-bold text-green-600">{metrics.activos}</p>
              </div>
            </div>
          </div>

          <div className="modern-card hover-scale p-6" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg floating" style={{animationDelay: '1s'}}>
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clientes Inactivos</p>
                <p className="text-2xl font-bold text-red-600">{metrics.inactivos}</p>
              </div>
            </div>
          </div>

          <div className="modern-card hover-scale p-6" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg floating" style={{animationDelay: '1.5s'}}>
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Prospectos</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.prospectos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="modern-card shadow-modern-lg p-6 mb-6 fade-in" style={{animationDelay: '0.4s'}}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-80 smooth-transition"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 pulse-animation" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent smooth-transition"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="Prospecto">Prospecto</option>
              </select>
            </div>

            {/* Add Client Button */}
            <button
              onClick={() => setShowModal(true)}
              className="modern-button glow-effect"
            >
              + Agregar Cliente
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="modern-card shadow-modern-lg overflow-hidden fade-in" style={{animationDelay: '0.6s'}}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedClients.map((client, index) => (
                  <tr key={client.id} className="hover:bg-gray-50 smooth-transition slide-in-left" style={{animationDelay: `${0.8 + index * 0.1}s`}}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 hover-scale">{client.nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.empresa}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.email}</div>
                      <div className="text-sm text-gray-500">{client.telefono}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full smooth-transition hover-scale ${getStatusColor(client.estado)}`}>
                        {client.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(client.fechaUltimoContacto).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(client)}
                        className="text-blue-600 hover:text-blue-900 mr-4 smooth-transition hover-scale"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="text-red-600 hover:text-red-900 smooth-transition hover-scale"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 slide-in-right" style={{animationDelay: '1s'}}>
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="modern-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="modern-button disabled:opacity-50 disabled:cursor-not-allowed ml-3"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium gradient-text">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                    <span className="font-medium gradient-text">
                      {Math.min(currentPage * itemsPerPage, filteredClients.length)}
                    </span>{' '}
                    de <span className="font-medium gradient-text">{filteredClients.length}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium smooth-transition hover-scale ${
                          page === currentPage
                            ? 'z-10 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-500 gradient-text glow-effect'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 fade-in">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-modern-lg rounded-md modern-card bounce-in">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium gradient-text">
                    {editingClient ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
                  </h3>
                  <CorporateLogo size="small" showText={false} className="floating" />
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 smooth-transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empresa
                    </label>
                    <input
                      type="text"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 smooth-transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 smooth-transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 smooth-transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 smooth-transition"
                    >
                      <option value="Prospecto">Prospecto</option>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Último Contacto
                    </label>
                    <input
                      type="date"
                      name="fechaUltimoContacto"
                      value={formData.fechaUltimoContacto}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 smooth-transition"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 smooth-transition hover-scale"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="modern-button glow-effect"
                    >
                      {editingClient ? 'Actualizar' : 'Agregar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CRM;
