import React, { useState, useEffect, useMemo } from 'react';

const EstadisticasAnimadas = ({ reportesTrabajo = [], herramientasElectricas = [], herramientasManuales = [] }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [counters, setCounters] = useState({
    trabajos: 0,
    herramientasElectricas: 0,
    herramientasManuales: 0
  });

  const targetValues = useMemo(() => ({
    trabajos: reportesTrabajo.length,
    herramientasElectricas: herramientasElectricas.length,
    herramientasManuales: herramientasManuales.length
  }), [reportesTrabajo.length, herramientasElectricas.length, herramientasManuales.length]);

  // Activar animación cuando el componente se monta
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Animar contadores
  useEffect(() => {
    if (isVisible) {
      const duration = 2000; // 2 segundos
      const intervals = 50; // Actualizar cada 50ms
      const steps = duration / intervals;

      const increment = {
        trabajos: targetValues.trabajos / steps,
        herramientasElectricas: targetValues.herramientasElectricas / steps,
        herramientasManuales: targetValues.herramientasManuales / steps
      };

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        setCounters({
          trabajos: Math.min(Math.floor(increment.trabajos * currentStep), targetValues.trabajos),
          herramientasElectricas: Math.min(Math.floor(increment.herramientasElectricas * currentStep), targetValues.herramientasElectricas),
          herramientasManuales: Math.min(Math.floor(increment.herramientasManuales * currentStep), targetValues.herramientasManuales)
        });

        if (currentStep >= steps) {
          clearInterval(timer);
          setCounters(targetValues); // Asegurar valores exactos
        }
      }, intervals);

      return () => clearInterval(timer);
    }
  }, [isVisible, targetValues]);

  const estadisticas = [
    {
      id: 'trabajos',
      icon: '📊',
      label: 'Trabajos Completados',
      value: counters.trabajos,
      color: '#28a745',
      description: 'Total de trabajos registrados'
    },
    {
      id: 'herramientasElectricas',
      icon: '⚡',
      label: 'Herramientas Eléctricas',
      value: counters.herramientasElectricas,
      color: '#ffc107',
      description: 'Asignadas actualmente'
    },
    {
      id: 'herramientasManuales',
      icon: '🔨',
      label: 'Herramientas Manuales',
      value: counters.herramientasManuales,
      color: '#17a2b8',
      description: 'Asignadas actualmente'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      {estadisticas.map((stat, index) => (
        <div
          key={stat.id}
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: `3px solid ${stat.color}`,
            textAlign: 'center',
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
            opacity: isVisible ? 1 : 0,
            transition: `all 0.6s ease-out ${index * 0.2}s`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Efecto de brillo */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${stat.color}20, transparent)`,
            animationName: isVisible ? 'shine' : 'none',
            animationDuration: '3s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: `${index * 0.5}s`
          }} />
          
          {/* Icono */}
          <div style={{
            fontSize: '2.5rem',
            marginBottom: '0.75rem',
            transform: isVisible ? 'rotate(0deg)' : 'rotate(-180deg)',
            transition: 'transform 0.8s ease-out',
            transitionDelay: `${index * 0.2 + 0.3}s`
          }}>
            {stat.icon}
          </div>
          
          {/* Valor animado */}
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: stat.color,
            marginBottom: '0.5rem',
            fontFamily: 'monospace'
          }}>
            {stat.value}
          </div>
          
          {/* Label */}
          <div style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#333',
            marginBottom: '0.25rem'
          }}>
            {stat.label}
          </div>
          
          {/* Descripción */}
          <div style={{
            fontSize: '0.85rem',
            color: '#666',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            transitionDelay: `${index * 0.2 + 0.6}s`
          }}>
            {stat.description}
          </div>
          
          {/* Barra de progreso decorativa */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '4px',
            backgroundColor: `${stat.color}20`
          }}>
            <div style={{
              height: '100%',
              backgroundColor: stat.color,
              width: isVisible ? '100%' : '0%',
              transition: 'width 1.5s ease-out',
              transitionDelay: `${index * 0.2 + 0.8}s`
            }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default EstadisticasAnimadas;
