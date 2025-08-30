/**
 * 📊 DASHBOARD DE INFORMES TÉCNICOS
 * ==================================
 * 
 * Vista principal con estadísticas, métricas y accesos rápidos
 * Incluye gráficos, resúmenes y notificaciones
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const DashboardInformes = ({ stats, onStatsUpdate, userRole, onNavigate }) => {
  const [metrics, setMetrics] = useState({
    informesHoy: 0,
    informesSemana: 0,
    promedioTiempo: '0h',
    eficiencia: 0
  });

  const [activities, setActivities] = useState([]);

  // Simular carga de datos
  useEffect(() => {
    const loadDashboardData = async () => {
      // Simular API calls
      setTimeout(() => {
        setMetrics({
          informesHoy: 3,
          informesSemana: 12,
          promedioTiempo: '2.5h',
          eficiencia: 95
        });

        setActivities([
          { id: 1, type: 'created', message: 'Informe IT-001 creado', time: '10:30 AM', status: 'success' },
          { id: 2, type: 'approved', message: 'Informe IT-002 aprobado', time: '09:15 AM', status: 'info' },
          { id: 3, type: 'pending', message: 'Informe IT-003 pendiente revisión', time: '08:45 AM', status: 'warning' }
        ]);
      }, 1000);
    };

    loadDashboardData();
  }, []);

  // Cards de estadísticas
  const statsCards = [
    {
      title: 'Total Informes',
      value: stats?.totalInformes || 0,
      icon: '📄',
      color: 'blue',
      subtitle: 'Todos los registros'
    },
    {
      title: 'Pendientes',
      value: stats?.informesPendientes || 0,
      icon: '⏳',
      color: 'orange',
      subtitle: 'Por revisar'
    },
    {
      title: 'Aprobados',
      value: stats?.informesAprobados || 0,
      icon: '✅',
      color: 'green',
      subtitle: 'Finalizados'
    },
    {
      title: 'Rechazados',
      value: stats?.informesRechazados || 0,
      icon: '❌',
      color: 'red',
      subtitle: 'Requieren corrección'
    }
  ];

  // Cards de métricas
  const metricsCards = [
    {
      title: 'Hoy',
      value: metrics.informesHoy,
      icon: '📅',
      subtitle: 'informes creados'
    },
    {
      title: 'Esta Semana',
      value: metrics.informesSemana,
      icon: '📊',
      subtitle: 'total semanal'
    },
    {
      title: 'Tiempo Promedio',
      value: metrics.promedioTiempo,
      icon: '⏱️',
      subtitle: 'por informe'
    },
    {
      title: 'Eficiencia',
      value: `${metrics.eficiencia}%`,
      icon: '🎯',
      subtitle: 'general'
    }
  ];

  const getColorClass = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      orange: 'from-orange-500 to-orange-600',
      green: 'from-green-500 to-green-600',
      red: 'from-red-500 to-red-600'
    };
    return colors[color] || colors.blue;
  };

  const getActivityIcon = (type) => {
    const icons = {
      created: '📝',
      approved: '✅',
      pending: '⏳',
      rejected: '❌'
    };
    return icons[type] || '📄';
  };

  const getStatusColor = (status) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.info;
  };

  return (
    <div className="dashboard-informes" style={{ padding: '2rem' }}>
      {/* Header con acciones rápidas */}
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '2rem', color: '#343a40' }}>
            Dashboard Informes Técnicos
          </h2>
          <p style={{ margin: 0, color: '#6c757d', fontSize: '1.1rem' }}>
            Resumen y estadísticas de tu actividad
          </p>
        </div>

        <button
          onClick={() => onNavigate('nuevo')}
          style={{
            background: 'linear-gradient(135deg, #007bff, #0056b3)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
          }}
        >
          <span>📝</span>
          Crear Informe
        </button>
      </motion.div>

      {/* Estadísticas principales */}
      <motion.div
        className="stats-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}
      >
        {statsCards.map((card, index) => (
          <motion.div
            key={card.title}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            style={{
              background: `linear-gradient(135deg, ${getColorClass(card.color).replace('from-', '').replace(' to-', ', ')})`,
              color: 'white',
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{card.icon}</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
              {card.title}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{card.subtitle}</div>
            
            {/* Efecto de brillo */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
              transform: 'rotate(45deg)',
              pointerEvents: 'none'
            }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Métricas adicionales */}
      <motion.div
        className="metrics-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{ marginBottom: '2rem' }}
      >
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#343a40' }}>
          📈 Métricas de Rendimiento
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {metricsCards.map((metric, index) => (
            <motion.div
              key={metric.title}
              className="metric-card"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e9ecef',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{metric.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.25rem', color: '#007bff' }}>
                {metric.value}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: '#343a40' }}>
                {metric.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>{metric.subtitle}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Actividad reciente */}
      <motion.div
        className="activity-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#343a40' }}>
          🕐 Actividad Reciente
        </h3>
        
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e9ecef',
          overflow: 'hidden'
        }}>
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                className="activity-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: index < activities.length - 1 ? '1px solid #e9ecef' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>{getActivityIcon(activity.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', color: '#343a40' }}>{activity.message}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.25rem' }}>
                    {activity.time}
                  </div>
                </div>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '20px',
                  fontSize: '0.7rem',
                  fontWeight: '600'
                }} className={getStatusColor(activity.status)}>
                  {activity.status}
                </span>
              </motion.div>
            ))
          ) : (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6c757d'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <p>No hay actividad reciente</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardInformes;
