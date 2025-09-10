import React, { useEffect, useState } from 'react';
import './Dashboard.css';

const ModuleTransition = ({ children, moduleKey, isActive }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsLoaded(true);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsLoaded(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!isLoaded) return null;

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.3s ease-in-out',
        minHeight: '100vh'
      }}
    >
      {children}
    </div>
  );
};

// Componente de Loading personalizado
export const ModuleLoader = ({ moduleName, userRole = 'empleado' }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getMotivationalMessage = () => {
    const messages = {
      perfil: [
        '🌟 Preparando tu espacio personalizado',
        '⚡ Cargando tu panel de control',
        '🎯 Configurando tu área de trabajo'
      ],
      herramientas_electricas: [
        '🔧 Conectando con el inventario',
        '⚡ Sincronizando herramientas',
        '🔌 Preparando el sistema eléctrico'
      ],
      herramientas_manuales: [
        '🔨 Organizando herramientas manuales',
        '🧰 Preparando el inventario',
        '⚒️ Cargando equipos disponibles'
      ],
      empleados: [
        '👥 Conectando con recursos humanos',
        '📋 Cargando perfiles de empleados',
        '💼 Preparando gestión de personal'
      ],
      historial_trabajos: [
        '📊 Analizando histórico de trabajos',
        '📈 Compilando estadísticas',
        '📋 Preparando reportes'
      ],
      ingresar_trabajo: [
        '📝 Preparando formulario de trabajo',
        '🚀 Configurando nueva tarea',
        '✨ Listo para registrar'
      ]
    };

    const moduleMessages = messages[moduleName] || ['🔄 Cargando módulo'];
    return moduleMessages[Math.floor(Math.random() * moduleMessages.length)];
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      margin: '2rem',
      padding: '3rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      {/* Spinner animado */}
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid #e3e3e3',
        borderTop: '4px solid #007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '2rem'
      }} />
      
      {/* Mensaje motivacional */}
      <h3 style={{
        color: '#333',
        fontSize: '1.25rem',
        fontWeight: '600',
        marginBottom: '0.5rem',
        textAlign: 'center'
      }}>
        {getMotivationalMessage()}
      </h3>
      
      {/* Dots animados */}
      <p style={{
        color: '#666',
        fontSize: '1rem',
        minHeight: '1.5rem',
        display: 'flex',
        alignItems: 'center'
      }}>
        Cargando{dots}
      </p>
      
      {/* Barra de progreso */}
      <div style={{
        width: '200px',
        height: '4px',
        backgroundColor: '#e9ecef',
        borderRadius: '2px',
        marginTop: '1rem',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #007bff, #28a745, #007bff)',
          animation: 'loading 2s ease-in-out infinite',
          borderRadius: '2px'
        }} />
      </div>
    </div>
  );
};

// Hook para gestionar el estado de carga de módulos
export const useModuleLoader = (activeModule) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingModule, setLoadingModule] = useState(activeModule);

  useEffect(() => {
    if (activeModule !== loadingModule) {
      setIsLoading(true);
      setLoadingModule(activeModule);
      
      // Tiempo de carga más corto y fijo
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800); // 800ms fijo

      return () => clearTimeout(timer);
    }
  }, [activeModule]); // Solo depende de activeModule

  return { isLoading, loadingModule };
};

export default ModuleTransition;
