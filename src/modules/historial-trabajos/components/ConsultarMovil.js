/**
 * 🚀 GLOBAL MOBILITY SOLUTIONS - CONSULTAR MÓVIL
 * ================================================
 * Componente para consultar remisiones por móvil en tiempo real
 * Utiliza onSnapshot para actualizaciones automáticas
 * Soporta prefijos BO- y Z70-
 */

import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../core/config/firebaseConfig";
import { motion } from 'framer-motion';
import { useAuth } from '../../../core/auth/AuthContext';
import { useRole } from '../../../core/auth/RoleContext';
import NavigationBar from '../../../shared/components/NavigationBar';
import './ConsultarMovil.css';

const ConsultarMovil = () => {
  // Hooks de autenticación y roles
  const { user } = useAuth();
  const { userRole } = useRole();

  // Estados principales
  const [busquedaMovil, setBusquedaMovil] = useState("");
  const [remisiones, setRemisiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estados para navegación
  const [navigationHistory, setNavigationHistory] = useState(['consultar-movil']);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);

  // 🔎 Normalizar móvil (eliminar prefijos BO- y Z70- para consultar en Firestore)
  const normalizarMovil = (valor) => {
    if (!valor) return null;
    // Convertir siempre a string y limpiar
    const valorStr = String(valor).trim();
    // Quitar prefijos Z70- o BO- (case insensitive)
    const limpio = valorStr.replace(/^(BO-|Z70-)/i, "");
    // Si después de limpiar queda vacío, retornar null
    if (!limpio) return null;
    // Retornar como string para hacer comparaciones flexibles
    return limpio;
  };

  // 🔎 Formatear móvil para mostrar con prefijo correcto
  const formatearMovil = (movil) => {
    if (!movil) return "N/A";
    const movilStr = String(movil);
    // Si ya tiene prefijo BO-, dejarlo igual
    if (movilStr.toUpperCase().startsWith("BO-")) return movilStr;
    // Si no tiene prefijo, agregar Z70-
    return `Z70-${movilStr}`;
  };

  // Formatear técnicos (tecnico1, tecnico2, tecnico3)
  const formatearTecnicos = (remision) => {
    const tecnicos = [remision.tecnico1, remision.tecnico2, remision.tecnico3]
      .filter(Boolean);
    return tecnicos.length > 0 ? tecnicos.join(', ') : 'No asignado';
  };

  // 🔎 Validar periodicidad de 6 meses
  const verificarAlerta6Meses = (fechaRemision) => {
    if (!fechaRemision) return false;
    const fecha = fechaRemision.toDate ? fechaRemision.toDate() : new Date(fechaRemision);
    const hoy = new Date();
    const seisMesesDespues = new Date(fecha);
    seisMesesDespues.setMonth(seisMesesDespues.getMonth() + 6);
    return hoy >= seisMesesDespues;
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    
    try {
      const fechaObj = fecha.toDate ? fecha.toDate() : new Date(fecha);
      if (isNaN(fechaObj.getTime())) return 'Fecha inválida';
      
      return fechaObj.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  };

  // 📡 Consulta en tiempo real con normalización flexible
  useEffect(() => {
    const movilNormalizado = normalizarMovil(busquedaMovil);
    if (!movilNormalizado) {
      setRemisiones([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    // Intentar consultas específicas primero (más eficiente)
    const consultas = [
      // Búsqueda como número
      query(collection(db, "remisiones"), where("movil", "==", Number(movilNormalizado))),
      // Búsqueda como string sin prefijo
      query(collection(db, "remisiones"), where("movil", "==", movilNormalizado)),
      // Búsqueda como string con prefijo Z70-
      query(collection(db, "remisiones"), where("movil", "==", `Z70-${movilNormalizado}`)),
      // Búsqueda como string con prefijo BO-
      query(collection(db, "remisiones"), where("movil", "==", `BO-${movilNormalizado}`))
    ];

    const resultadosCombinados = new Map(); // Usar Map para evitar duplicados

    let consultasCompletadas = 0;
    const totalConsultas = consultas.length;

    consultas.forEach((q, index) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          // Agregar resultados al Map para evitar duplicados
          snapshot.docs.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            resultadosCombinados.set(doc.id, data);
          });

          consultasCompletadas++;
          
          // Cuando todas las consultas estén completas
          if (consultasCompletadas === totalConsultas) {
            const resultadosFinales = Array.from(resultadosCombinados.values());
            setRemisiones(resultadosFinales);
            setLoading(false);

            if (!resultadosFinales.length) {
              setError("No se encontró ninguna remisión para este móvil.");
            }
          }
        },
        (err) => {
          console.error(`Error en consulta ${index}:`, err);
          consultasCompletadas++;
          
          if (consultasCompletadas === totalConsultas) {
            const resultadosFinales = Array.from(resultadosCombinados.values());
            if (!resultadosFinales.length) {
              setError("Error al cargar los datos.");
            }
            setLoading(false);
          }
        }
      );

      // Guardar las funciones de unsubscribe para limpiar después
      if (!window.consultaMovilUnsubscribers) {
        window.consultaMovilUnsubscribers = [];
      }
      window.consultaMovilUnsubscribers.push(unsubscribe);
    });

    // Función de limpieza
    return () => {
      if (window.consultaMovilUnsubscribers) {
        window.consultaMovilUnsubscribers.forEach(unsub => unsub());
        window.consultaMovilUnsubscribers = [];
      }
    };
  }, [busquedaMovil]);

  // Funciones de navegación
  const handleNavigateBack = () => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(prev => prev - 1);
    }
  };

  const handleNavigateForward = () => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      setCurrentHistoryIndex(prev => prev + 1);
    }
  };

  return (
    <div className="consultar-movil">
      {/* Barra de navegación */}
      <NavigationBar
        onBack={handleNavigateBack}
        onForward={handleNavigateForward}
        canGoBack={currentHistoryIndex > 0}
        canGoForward={currentHistoryIndex < navigationHistory.length - 1}
        currentPath="historial-trabajos/consultar-movil"
        title="Consultar Móvil"
        showBreadcrumbs={true}
      />
      
      {/* Header */}
      <motion.div 
        className="header-section"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="page-title">🔧 Consultar Móvil</h1>
        <div className="user-info">
          <span className="user-role-badge">{userRole?.toUpperCase()}</span>
          <span className="user-email">{user?.email}</span>
        </div>
      </motion.div>

      {/* Búsqueda */}
      <motion.div 
        className="search-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="search-container">
          <div className="search-group">
            <label>Número de Móvil</label>
            <input
              type="text"
              placeholder="Ingrese móvil (ej: 7354, Z70-7354, BO-7354)"
              value={busquedaMovil}
              onChange={(e) => setBusquedaMovil(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="search-info">
          <p>💡 <strong>Búsqueda en tiempo real:</strong> Los resultados se actualizan automáticamente. 
             Soporta formatos: 7354, Z70-7354, BO-7354</p>
        </div>
      </motion.div>

      {/* Resultados */}
      <motion.div 
        className="results-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {loading && <p className="loading-message">⏳ Cargando datos...</p>}
        {error && <p className="error-message" style={{ color: "red" }}>{error}</p>}

        {!loading && !error && remisiones.length > 0 && (
          <div className="remisiones-cards-grid">
            {remisiones.map((remision, index) => {
              const disponible = verificarAlerta6Meses(remision.fecha_remision);
              return (
                <motion.div 
                  key={remision.id} 
                  className="remision-card-busqueda"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}
                >
                  {/* Header del card */}
                  <div className="card-header">
                    <div className="remision-info">
                      <div className="remision-number">
                        <strong>Remisión #{remision.remision}</strong>
                      </div>
                      <div className="movil-display">
                        🚐 {formatearMovil(remision.movil)}
                      </div>
                    </div>
                  </div>

                  {/* Contenido del card */}
                  <div className="card-content">
                    <div className="info-row">
                      <span className="label">📋 No. Orden:</span>
                      <span className="value">{remision.no_orden || 'N/A'}</span>
                    </div>

                    <div className="info-row">
                      <span className="label">📅 Fecha Remisión:</span>
                      <span className="value fecha-destacada">
                        {formatearFecha(remision.fecha_remision)}
                      </span>
                    </div>
                    
                    <div className="info-row">
                      <span className="label">👤 Técnico(s):</span>
                      <span className="value">{formatearTecnicos(remision)}</span>
                    </div>

                    <div className="info-row servicios-row">
                      <span className="label">🔧 Servicios:</span>
                      <div className="servicios-list">
                        {[remision.servicio1, remision.servicio2, remision.servicio3, remision.servicio4, remision.servicio5]
                          .filter(Boolean)
                          .map((servicio, idx) => (
                            <div key={idx} className="servicio-item">
                              • {servicio}
                            </div>
                          ))
                        }
                        {![remision.servicio1, remision.servicio2, remision.servicio3, remision.servicio4, remision.servicio5]
                          .filter(Boolean).length && (
                          <div className="servicio-item no-servicios">
                            No hay servicios registrados
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Alerta de 6 meses */}
                    <div className="info-row">
                      <span className="label">⏰ Estado de Mantenimiento:</span>
                      <span className="value" style={{ color: disponible ? "green" : "orange" }}>
                        {disponible
                          ? "✅ Disponible para nuevo mantenimiento"
                          : "⏳ Aún no cumple los 6 meses"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ConsultarMovil;
