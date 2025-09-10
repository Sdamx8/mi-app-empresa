import React, { useState, useEffect } from 'react';

const AnunciosEmpresariales = ({ userRole = 'empleado', userName = 'Usuario' }) => {
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Anuncios dinámicos basados en el rol del usuario
  const announcements = [
    {
      id: 1,
      type: 'info',
      title: '🎯 Objetivo del Mes',
      message: 'Mejorar eficiencia en reparaciones un 15%. ¡Vamos por buen camino!',
      priority: 'medium',
      roles: ['directivo', 'administrativo', 'tecnico'],
      color: '#17a2b8'
    },
    {
      id: 2,
      type: 'success',
      title: '🏆 Felicitaciones',
      message: 'El equipo técnico ha completado 95% de trabajos a tiempo este mes.',
      priority: 'high',
      roles: ['directivo', 'administrativo', 'tecnico'],
      color: '#28a745'
    },
    {
      id: 3,
      type: 'warning',
      title: '🔧 Mantenimiento Programado',
      message: 'Revisión de herramientas eléctricas programada para el próximo viernes.',
      priority: 'high',
      roles: ['tecnico', 'administrativo'],
      color: '#ffc107'
    },
    {
      id: 4,
      type: 'primary',
      title: '📋 Nueva Funcionalidad',
      message: 'Sistema de reportes automatizados ahora disponible en el módulo CRM.',
      priority: 'medium',
      roles: ['directivo', 'administrativo'],
      color: '#007bff'
    },
    {
      id: 5,
      type: 'info',
      title: '💡 Tip del Día',
      message: 'Usa el historial de trabajos para encontrar patrones y mejorar procesos.',
      priority: 'low',
      roles: ['directivo', 'administrativo', 'tecnico'],
      color: '#6f42c1'
    },
    {
      id: 6,
      type: 'success',
      title: '🎉 Cumpleaños del Mes',
      message: 'Felicitamos a todos los empleados que cumplen años este mes.',
      priority: 'low',
      roles: ['directivo', 'administrativo', 'tecnico'],
      color: '#e83e8c'
    }
  ];

  // Filtrar anuncios por rol
  const filteredAnnouncements = announcements.filter(ann => 
    ann.roles.includes(userRole)
  );

  // Cambiar anuncio automáticamente cada 8 segundos
  useEffect(() => {
    if (filteredAnnouncements.length > 1) {
      const interval = setInterval(() => {
        setCurrentAnnouncement(prev => 
          (prev + 1) % filteredAnnouncements.length
        );
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [filteredAnnouncements.length]);

  if (!isVisible || filteredAnnouncements.length === 0) {
    return null;
  }

  const current = filteredAnnouncements[currentAnnouncement];

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      border: `3px solid ${current.color}`,
      position: 'relative',
      overflow: 'hidden',
      animation: 'slideInDown 0.6s ease-out'
    }}>
      {/* Barra superior con gradiente */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${current.color}, ${current.color}88, ${current.color})`
      }} />

      {/* Header del anuncio */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          margin: 0,
          color: current.color,
          fontSize: '1.1rem',
          fontWeight: '600'
        }}>
          {current.title}
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Indicadores de navegación */}
          {filteredAnnouncements.length > 1 && (
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {filteredAnnouncements.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentAnnouncement(index)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: index === currentAnnouncement ? current.color : '#e9ecef',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Botón cerrar */}
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '0.25rem',
              borderRadius: '4px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.color = '#495057';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#6c757d';
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Contenido del anuncio */}
      <p style={{
        margin: 0,
        color: '#495057',
        fontSize: '1rem',
        lineHeight: '1.5'
      }}>
        {current.message}
      </p>

      {/* Saludo personalizado */}
      {current.priority === 'high' && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: `${current.color}15`,
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: current.color,
          fontWeight: '500'
        }}>
          💼 {userName}, este anuncio requiere tu atención
        </div>
      )}

      {/* Animación de progreso */}
      {filteredAnnouncements.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2px',
          backgroundColor: current.color,
          animation: 'progress 8s linear infinite',
          width: '100%'
        }} />
      )}

      <style jsx>{`
        @keyframes slideInDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes progress {
          from {
            transform: scaleX(0);
            transform-origin: left;
          }
          to {
            transform: scaleX(1);
            transform-origin: left;
          }
        }
      `}</style>
    </div>
  );
};

export default AnunciosEmpresariales;
