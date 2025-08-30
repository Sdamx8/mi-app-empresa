import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Clock,
  Users,
  Package,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../AuthContext';
import { useRole } from '../../RoleContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from '../../hooks/useToast';

const Servicios = () => {
  // Estados
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('todas');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  
  // Form data
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion_actividad: '',
    costo: '',
    categoria: '',
    tiempo_estimado: '',
    recurso_humano_requerido: '',
    materiales_suministrados: ''
  });

  // Hooks de autenticación
  const { user } = useAuth();
  const { userRole, currentEmployee } = useRole();
  
  // Configuración de paginación
  const itemsPerPage = 10;

  // Verificación de permisos
  const canManage = useMemo(() => {
    return userRole === 'directivo' || userRole === 'administrativo';
  }, [userRole]);

  // Cargar servicios desde Firebase
  const loadServicios = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'servicios'), orderBy('titulo'));
      const querySnapshot = await getDocs(q);
      const serviciosData = [];
      querySnapshot.forEach((doc) => {
        serviciosData.push({ id: doc.id, ...doc.data() });
      });
      setServicios(serviciosData);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar tipos de empleados
  const loadEmpleados = async () => {
    try {
      const q = query(collection(db, 'empleados'));
      const querySnapshot = await getDocs(q);
      const tiposEmpleados = new Set();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.tipo_empleado) {
          tiposEmpleados.add(data.tipo_empleado);
        }
      });
      setEmpleados(Array.from(tiposEmpleados));
    } catch (error) {
      console.error('Error al cargar tipos de empleados:', error);
    }
  };

  useEffect(() => {
    loadServicios();
    loadEmpleados();
  }, []);

  // Validación del formulario
  const validateForm = () => {
    const errors = {};
    
    if (!formData.titulo.trim()) {
      errors.titulo = 'El título es requerido';
    }
    
    if (!formData.descripcion_actividad.trim()) {
      errors.descripcion_actividad = 'La descripción es requerida';
    }
    
    if (!formData.costo || formData.costo <= 0) {
      errors.costo = 'El costo debe ser mayor a 0';
    }
    
    if (!formData.categoria) {
      errors.categoria = 'La categoría es requerida';
    }
    
    if (!formData.tiempo_estimado.trim()) {
      errors.tiempo_estimado = 'El tiempo estimado es requerido';
    }
    
    if (!formData.recurso_humano_requerido) {
      errors.recurso_humano_requerido = 'El recurso humano es requerido';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar servicio
  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Error de validación",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const servicioData = {
        ...formData,
        costo: parseFloat(formData.costo),
        actualizado_por: currentEmployee?.nombre || user?.email,
        fecha_actualizacion: new Date().toISOString()
      };

      if (editMode && selectedServicio) {
        // Actualizar servicio existente
        await updateDoc(doc(db, 'servicios', selectedServicio.id), servicioData);
        toast({
          title: "Éxito",
          description: "Servicio actualizado correctamente",
        });
      } else {
        // Crear nuevo servicio
        servicioData.id_servicio = `SRV-${Date.now()}`;
        servicioData.creado_por = currentEmployee?.nombre || user?.email;
        servicioData.fecha_creacion = new Date().toISOString();
        await addDoc(collection(db, 'servicios'), servicioData);
        toast({
          title: "Éxito",
          description: "Servicio creado correctamente",
        });
      }

      setShowModal(false);
      resetForm();
      loadServicios();
    } catch (error) {
      console.error('Error al guardar servicio:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el servicio",
        variant: "destructive",
      });
    }
  };

  // Eliminar servicio
  const handleDelete = async () => {
    if (!selectedServicio) return;

    try {
      await deleteDoc(doc(db, 'servicios', selectedServicio.id));
      toast({
        title: "Éxito",
        description: "Servicio eliminado correctamente",
      });
      setShowDeleteConfirm(false);
      setSelectedServicio(null);
      loadServicios();
    } catch (error) {
      console.error('Error al eliminar servicio:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio",
        variant: "destructive",
      });
    }
  };

  // Reset formulario
  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion_actividad: '',
      costo: '',
      categoria: '',
      tiempo_estimado: '',
      recurso_humano_requerido: '',
      materiales_suministrados: ''
    });
    setFormErrors({});
    setEditMode(false);
    setSelectedServicio(null);
  };

  // Abrir modal para nuevo servicio
  const handleNew = () => {
    resetForm();
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (servicio) => {
    setFormData({
      titulo: servicio.titulo || '',
      descripcion_actividad: servicio.descripcion_actividad || '',
      costo: servicio.costo || '',
      categoria: servicio.categoria || '',
      tiempo_estimado: servicio.tiempo_estimado || '',
      recurso_humano_requerido: servicio.recurso_humano_requerido || '',
      materiales_suministrados: servicio.materiales_suministrados || ''
    });
    setSelectedServicio(servicio);
    setEditMode(true);
    setShowModal(true);
  };

  // Ver detalle
  const handleView = (servicio) => {
    setSelectedServicio(servicio);
    setShowDetail(true);
  };

  // Confirmar eliminación
  const confirmDelete = (servicio) => {
    setSelectedServicio(servicio);
    setShowDeleteConfirm(true);
  };

  // Filtrar servicios
  const filteredServicios = useMemo(() => {
    return servicios.filter(servicio => {
      const matchSearch = servicio.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         servicio.descripcion_actividad?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory === 'todas' || servicio.categoria === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [servicios, searchTerm, filterCategory]);

  // Paginación
  const paginatedServicios = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredServicios.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredServicios, currentPage]);

  const totalPages = Math.ceil(filteredServicios.length / itemsPerPage);

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(value);
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">
            Solo usuarios con rol Administrativo o Directivo pueden acceder a este módulo.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Tu rol actual: <span className="font-semibold">{userRole}</span>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-8 h-8 text-blue-600" />
              Gestión de Servicios
            </h1>
            <p className="text-gray-600 mt-1">Administra el catálogo de servicios de la empresa</p>
          </div>
          <Button onClick={handleNew} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nuevo Servicio
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-blue-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Servicios</p>
                <p className="text-2xl font-bold text-gray-800">{servicios.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-green-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Instalación</p>
                <p className="text-2xl font-bold text-gray-800">
                  {servicios.filter(s => s.categoria === 'Instalación').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-yellow-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Mantenimiento</p>
                <p className="text-2xl font-bold text-gray-800">
                  {servicios.filter(s => s.categoria === 'Mantenimiento').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-purple-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Reparación</p>
                <p className="text-2xl font-bold text-gray-800">
                  {servicios.filter(s => s.categoria === 'Reparación').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Filtros y búsqueda */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por título o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-64">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                <SelectItem value="Instalación">Instalación</SelectItem>
                <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="Reparación">Reparación</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Tabla de servicios */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredServicios.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron servicios</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Costo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiempo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recurso Humano
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {paginatedServicios.map((servicio, index) => (
                      <motion.tr
                        key={servicio.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {servicio.id_servicio || servicio.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{servicio.titulo}</div>
                          <div className="text-sm text-gray-500">
                            {servicio.descripcion_actividad?.substring(0, 50)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${servicio.categoria === 'Instalación' ? 'bg-green-100 text-green-800' :
                              servicio.categoria === 'Mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                              servicio.categoria === 'Reparación' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {servicio.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(servicio.costo || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {servicio.tiempo_estimado}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {servicio.recurso_humano_requerido}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(servicio)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(servicio)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete(servicio)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{' '}
                      <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                      {' '}a{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredServicios.length)}
                      </span>
                      {' '}de{' '}
                      <span className="font-medium">{filteredServicios.length}</span>
                      {' '}resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {[...Array(totalPages)].map((_, i) => (
                        <Button
                          key={i + 1}
                          variant={currentPage === i + 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i + 1)}
                          className="mx-1"
                        >
                          {i + 1}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Modal de formulario */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode ? 'Editar Servicio' : 'Nuevo Servicio'}
            </DialogTitle>
            <DialogDescription>
              {editMode ? 'Modifica los datos del servicio' : 'Completa los datos del nuevo servicio'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Nombre del servicio"
                  className={formErrors.titulo ? 'border-red-500' : ''}
                />
                {formErrors.titulo && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.titulo}</p>
                )}
              </div>

              <div>
                <Label htmlFor="categoria">Categoría *</Label>
                <Select 
                  value={formData.categoria} 
                  onValueChange={(value) => setFormData({...formData, categoria: value})}
                >
                  <SelectTrigger className={formErrors.categoria ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instalación">Instalación</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Reparación">Reparación</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.categoria && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.categoria}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción de la actividad *</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion_actividad}
                onChange={(e) => setFormData({...formData, descripcion_actividad: e.target.value})}
                placeholder="Describe detalladamente la actividad del servicio"
                rows={4}
                className={formErrors.descripcion_actividad ? 'border-red-500' : ''}
              />
              {formErrors.descripcion_actividad && (
                <p className="text-red-500 text-sm mt-1">{formErrors.descripcion_actividad}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costo">Costo (COP) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="costo"
                    type="number"
                    value={formData.costo}
                    onChange={(e) => setFormData({...formData, costo: e.target.value})}
                    placeholder="0"
                    className={`pl-10 ${formErrors.costo ? 'border-red-500' : ''}`}
                  />
                </div>
                {formErrors.costo && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.costo}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tiempo">Tiempo estimado *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="tiempo"
                    value={formData.tiempo_estimado}
                    onChange={(e) => setFormData({...formData, tiempo_estimado: e.target.value})}
                    placeholder="Ej: 2 horas, 3 días"
                    className={`pl-10 ${formErrors.tiempo_estimado ? 'border-red-500' : ''}`}
                  />
                </div>
                {formErrors.tiempo_estimado && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.tiempo_estimado}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="recurso">Recurso humano requerido *</Label>
              <Select 
                value={formData.recurso_humano_requerido} 
                onValueChange={(value) => setFormData({...formData, recurso_humano_requerido: value})}
              >
                <SelectTrigger className={formErrors.recurso_humano_requerido ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecciona el tipo de empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                  <SelectItem value="Técnico">Técnico</SelectItem>
                  <SelectItem value="Auxiliar">Auxiliar</SelectItem>
                  <SelectItem value="Operario">Operario</SelectItem>
                  <SelectItem value="Especialista">Especialista</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.recurso_humano_requerido && (
                <p className="text-red-500 text-sm mt-1">{formErrors.recurso_humano_requerido}</p>
              )}
            </div>

            <div>
              <Label htmlFor="materiales">Materiales suministrados</Label>
              <Textarea
                id="materiales"
                value={formData.materiales_suministrados}
                onChange={(e) => setFormData({...formData, materiales_suministrados: e.target.value})}
                placeholder="Lista de materiales incluidos en el servicio (uno por línea)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editMode ? 'Actualizar' : 'Crear'} Servicio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el servicio "{selectedServicio?.titulo}"? 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalle */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Servicio</DialogTitle>
          </DialogHeader>
          {selectedServicio && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">ID del Servicio</Label>
                  <p className="font-medium">{selectedServicio.id_servicio || selectedServicio.id}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Título</Label>
                  <p className="font-medium">{selectedServicio.titulo}</p>
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Descripción de la actividad</Label>
                <p className="font-medium mt-1">{selectedServicio.descripcion_actividad}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Categoría</Label>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full mt-1
                    ${selectedServicio.categoria === 'Instalación' ? 'bg-green-100 text-green-800' :
                      selectedServicio.categoria === 'Mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                      selectedServicio.categoria === 'Reparación' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'}`}>
                    {selectedServicio.categoria}
                  </span>
                </div>
                <div>
                  <Label className="text-gray-600">Costo</Label>
                  <p className="font-medium">{formatCurrency(selectedServicio.costo || 0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Tiempo estimado</Label>
                  <p className="font-medium">{selectedServicio.tiempo_estimado}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Recurso humano</Label>
                  <p className="font-medium">{selectedServicio.recurso_humano_requerido}</p>
                </div>
              </div>

              {selectedServicio.materiales_suministrados && (
                <div>
                  <Label className="text-gray-600">Materiales suministrados</Label>
                  <p className="font-medium mt-1 whitespace-pre-wrap">
                    {selectedServicio.materiales_suministrados}
                  </p>
                </div>
              )}

              <div className="border-t pt-4 text-sm text-gray-500">
                {selectedServicio.creado_por && (
                  <p>Creado por: {selectedServicio.creado_por} - {selectedServicio.fecha_creacion}</p>
                )}
                {selectedServicio.actualizado_por && (
                  <p>Última actualización: {selectedServicio.actualizado_por} - {selectedServicio.fecha_actualizacion}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetail(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Servicios;
