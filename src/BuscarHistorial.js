import React, { useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useAuth } from './AuthContext';
import LoginComponent from './LoginComponent';
import './App.css';

// Orden de campos igual al formulario
const CAMPOS = [
  'remision',
  'movil',
  'no_orden',
  'estado',
  'descripcion',
  'fecha_remision',
  'fecha_maximo',
  'fecha_bit_prof',
  'radicacion',
  'id_bit',
  'no_fact_elect',
  'subtotal',
  'total',
  'une',
  'carroceria',
  'autorizo',
  'tecnico',
  'genero'
];

const estadosOpciones = [
  'CANCELADO',
  'CORTESIA',
  'GARANTIA',
  'GENERADO',
  'PENDIENTE',
  'PROFORMA',
  'RADICADO',
  'SIN VINCULAR'
];

const tecnicosOpciones = [
  'THOMAS FLORES',
  'DANNY GIL',
  'OCTAVIO HERRERA',
  'EULICE GARAVITO',
  'ANTONIO BUITRAGO',
  'SERGIO ANZOLA',
  'SERGIO AYALA',
  'JOSE AYALA',
  'JAVIER MORALES',
  'THOMAS FLORES - DANNY GIL',
  'EULICE GARAVITO - OCTAVIO HERRERA'
];

const generoOpciones = [
  'ERICA FAJARDO',
  'ANGY FUENTE',
  'SERGIO AYALA'
];

const uneOpciones = [
  'ALIMENTADORES',
  'AUTOSUR',
  'ESTANCIA',
  'SANBERNARDINO',
  'SANJOSE1',
  'SANJOSE2',
  'SEVILLANA'
];

const camposFecha = [
  'fecha_remision',
  'fecha_maximo',
  'fecha_bit_prof',
  'radicacion'
];

function formatDateToInput(value) {
  if (!value) return '';
  if (typeof value === 'string' && value.includes('/')) {
    const partes = value.split('/');
    if (partes.length === 3) {
      const [dd, mm, yyyy] = partes;
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
  }
  return value;
}

function formatInputToDate(value) {
  if (!value) return '';
  const [yyyy, mm, dd] = value.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

// Función para mostrar valores seguros en celdas
function safeCell(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') {
    // Timestamp Firestore
    if (value.seconds !== undefined && value.nanoseconds !== undefined) {
      const date = new Date(value.seconds * 1000);
      return date.toLocaleDateString();
    }
    // Array
    if (Array.isArray(value)) {
      return value.map(safeCell).join(', ');
    }
    // Otros objetos
    return JSON.stringify(value);
  }
  return value;
}

// Calcula si la fecha de remisión es mayor o menor a 6 meses y 15 días
function estadoTrabajo(fechaRemision) {
  let fecha = null;
  if (fechaRemision && typeof fechaRemision === 'object' && fechaRemision.seconds) {
    fecha = new Date(fechaRemision.seconds * 1000);
  } else if (typeof fechaRemision === 'string') {
    // dd/mm/yyyy
    const partes = fechaRemision.split('/');
    if (partes.length === 3) {
      fecha = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
    }
  }
  if (!fecha || isNaN(fecha.getTime())) return null;

  const hoy = new Date();
  // Suma 6 meses y 15 días a la fecha de remisión
  const fechaLimite = new Date(fecha);
  fechaLimite.setMonth(fechaLimite.getMonth() + 6);
  fechaLimite.setDate(fechaLimite.getDate() + 15);

  return hoy >= fechaLimite ? 'verde' : 'rojo';
}

function BuscarHistorial() {
  const [movil, setMovil] = useState('');
  const [estado, setEstado] = useState('');
  const [remision, setRemision] = useState('');
  const [resultados, setResultados] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [registroAEditar, setRegistroAEditar] = useState(null);
  const [cargando, setCargando] = useState(false);
  const { user, logout } = useAuth();

  // Si no hay usuario, mostrar el componente de login
  if (!user) {
    return <LoginComponent />;
  }

  const buscarHistorial = async () => {
    try {
      setCargando(true);
      setMensaje('');
      
      const valorMovil = movil.trim().toUpperCase();
      const valorEstado = estado.trim().toUpperCase();
      const valorRemision = remision.trim().toUpperCase();

      const ref = collection(db, 'remisiones');
      const snapshot = await getDocs(ref);

      const datos = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(doc => {
          const movilMatch = valorMovil
            ? String(doc.movil || '').toUpperCase().includes(valorMovil)
            : true;
          const estadoMatch = valorEstado
            ? String(doc.estado || '').toUpperCase().includes(valorEstado)
            : true;
          const remisionMatch = valorRemision
            ? String(doc.remision || '').toUpperCase() === valorRemision
            : true;

          return movilMatch && estadoMatch && remisionMatch;
        });

      if (datos.length === 0) {
        setMensaje('No se encontraron resultados.');
        setResultados([]);
      } else {
        setMensaje('');
        setResultados(datos);
      }
    } catch (error) {
      console.error('Error al buscar:', error);
      setMensaje('Hubo un error al buscar.');
    } finally {
      setCargando(false);
    }
  };

  const handleEditar = (registro) => {
    setRegistroAEditar(registro);
  };

  const guardarCambios = async () => {
    try {
      const { id, ...datosSinID } = registroAEditar;
      const ref = doc(db, 'remisiones', id);
      await updateDoc(ref, datosSinID);
      alert('✅ Registro actualizado con éxito');
      setRegistroAEditar(null);
      buscarHistorial();
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      alert('Hubo un error al guardar los cambios.');
    }
  };

  const eliminarRegistro = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return;
    try {
      await deleteDoc(doc(db, 'remisiones', id));
      alert('Registro eliminado correctamente');
      buscarHistorial();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Hubo un error al eliminar el registro.');
    }
  };

  const limpiarBusqueda = () => {
    setMovil('');
    setEstado('');
    setRemision('');
    setResultados([]);
    setMensaje('');
    setRegistroAEditar(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con logout */}
        <div className="modern-card p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="corporate-logo">
                <span className="logo-text">🔍</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">
                  Gestión de Remisiones
                </h1>
                <p className="text-gray-600">
                  Sistema avanzado de búsqueda y edición
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                👨‍💼 {user.email}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="modern-card p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            🔍 Filtros de Búsqueda
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Móvil
              </label>
              <input
                type="text"
                value={movil}
                onChange={(e) => setMovil(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Ej: 123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Todos los estados</option>
                {estadosOpciones.map(opcion => (
                  <option key={opcion} value={opcion}>{opcion}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Remisión
              </label>
              <input
                type="text"
                value={remision}
                onChange={(e) => setRemision(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Buscar remisión específica"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={buscarHistorial}
              disabled={cargando}
              className="modern-button px-6 py-3 enhanced-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Buscando...
                </>
              ) : (
                <>🔍 Buscar</>
              )}
            </button>
            
            <button
              onClick={limpiarBusqueda}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 enhanced-hover"
            >
              🗑️ Limpiar
            </button>
          </div>
        </div>

        {/* Loading State */}
        {cargando && (
          <div className="modern-card p-8 text-center">
            <div className="corporate-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Consultando base de datos de remisiones...</p>
          </div>
        )}

        {/* Message */}
        {mensaje && !cargando && (
          <div className="modern-card p-6 mb-8 border-l-4 border-yellow-500 bg-yellow-50">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <p className="text-yellow-800 font-medium">{mensaje}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {resultados.length > 0 && !cargando && (
          <div className="modern-card p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                📊 Resultados de la Búsqueda
              </h2>
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                <span className="font-semibold">{resultados.length}</span> registro(s) encontrado(s)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resultados.map((item, index) => {
                const estadoBtn = estadoTrabajo(item.fecha_remision);
                return (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-6 shadow-modern hover:shadow-lg transition-all duration-200"
                  >
                    {CAMPOS.map((campo) => (
                      <div key={campo} className="mb-3 flex justify-between">
                        <span className="text-sm font-medium text-gray-600 capitalize">
                          {campo.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-sm text-gray-900 font-medium">
                          {safeCell(item[campo])}
                        </span>
                      </div>
                    ))}
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEditar(item)}
                          className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => eliminarRegistro(item.id)}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                        >
                          🗑️ Eliminar
                        </button>
                        <button
                          className={`px-3 py-1 text-white text-xs rounded-lg ${
                            estadoBtn === 'verde' 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-red-500 hover:bg-red-600'
                          } transition-colors`}
                        >
                          {estadoBtn === 'verde'
                            ? '✅ > 6 meses'
                            : '⏰ < 6 meses'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Edit Form */}
        {registroAEditar && (
          <div className="modern-card p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              ✏️ Editar Registro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CAMPOS.map((campo) => (
                <div key={campo}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {campo.replace(/_/g, ' ')}
                  </label>
                  {campo === 'estado' ? (
                    <select
                      value={registroAEditar[campo] || ''}
                      onChange={e =>
                        setRegistroAEditar({
                          ...registroAEditar,
                          [campo]: e.target.value
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccione estado</option>
                      {estadosOpciones.map(opcion => (
                        <option key={opcion} value={opcion}>{opcion}</option>
                      ))}
                    </select>
                  ) : campo === 'tecnico' ? (
                    <select
                      value={registroAEditar[campo] || ''}
                      onChange={e =>
                        setRegistroAEditar({
                          ...registroAEditar,
                          [campo]: e.target.value
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccione técnico</option>
                      {tecnicosOpciones.map(opcion => (
                        <option key={opcion} value={opcion}>{opcion}</option>
                      ))}
                    </select>
                  ) : campo === 'genero' ? (
                    <select
                      value={registroAEditar[campo] || ''}
                      onChange={e =>
                        setRegistroAEditar({
                          ...registroAEditar,
                          [campo]: e.target.value
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccione persona</option>
                      {generoOpciones.map(opcion => (
                        <option key={opcion} value={opcion}>{opcion}</option>
                      ))}
                    </select>
                  ) : campo === 'une' ? (
                    <select
                      value={registroAEditar[campo] || ''}
                      onChange={e =>
                        setRegistroAEditar({
                          ...registroAEditar,
                          [campo]: e.target.value
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccione UNE</option>
                      {uneOpciones.map(opcion => (
                        <option key={opcion} value={opcion}>{opcion}</option>
                      ))}
                    </select>
                  ) : camposFecha.includes(campo) ? (
                    <input
                      type="date"
                      value={formatDateToInput(registroAEditar[campo])}
                      onChange={e =>
                        setRegistroAEditar({
                          ...registroAEditar,
                          [campo]: formatInputToDate(e.target.value)
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <input
                      type={campo === 'id_bit' || campo === 'total' || campo === 'subtotal' ? 'number' : 'text'}
                      value={registroAEditar[campo] || ''}
                      placeholder={campo}
                      onChange={e => {
                        let value = e.target.value;
                        if (campo === 'subtotal') {
                          const subtotalNum = parseFloat(value) || 0;
                          const totalNum = subtotalNum * 1.19;
                          setRegistroAEditar({
                            ...registroAEditar,
                            subtotal: value,
                            total: totalNum.toFixed(2)
                          });
                        } else {
                          setRegistroAEditar({
                            ...registroAEditar,
                            [campo]: value
                          });
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={guardarCambios}
                className="modern-button px-6 py-3"
              >
                💾 Guardar Cambios
              </button>
              <button
                onClick={() => setRegistroAEditar(null)}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BuscarHistorial;
