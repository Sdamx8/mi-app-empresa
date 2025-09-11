/**
 * 📊 WIDGET DE ESTADÍSTICAS EMPRESARIALES
 * =====================================
 * Componente para mostrar estadísticas clave del sistema ERP
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import { useRole } from '../../core/auth/RoleContext';

const ERPStatsWidget = () => {
  const [stats, setStats] = useState({
    totalRemisiones: 0,
    remisionesPendientes: 0,
    remisionesCompletadas: 0,
    empleadosActivos: 0,
    herramientasOperativas: 0,
    ventasMensual: 0,
    loading: true
  });

  const { user } = useAuth();
  const { userRole } = useRole();

  useEffect(() => {
    // Simulación de carga de estadísticas
    const loadStats = async () => {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStats({
        totalRemisiones: 1247,
        remisionesPendientes: 23,
        remisionesCompletadas: 1178,
        empleadosActivos: 45,
        herramientasOperativas: 156,
        ventasMensual: 125000000, // $125M COP
        loading: false
      });
    };

    loadStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const StatCard = ({ icon, title, value, subtitle, color, trend }) => (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid #e9ecef',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    }}
    >
      {/* Indicador de color */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        backgroundColor: color
      }}></div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <span style={{ fontSize: '2rem' }}>{icon}</span>
        {trend && (
          <span style={{
            fontSize: '0.8rem',
            color: trend > 0 ? '#28a745' : '#dc3545',
            fontWeight: '600'
          }}>
            {trend > 0 ? '↗️' : '↘️'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      
      <div style={{
        fontSize: '2rem',
        fontWeight: '700',
        color: '#495057',
        marginBottom: '0.5rem'
      }}>
        {stats.loading ? (
          <div style={{
            width: '80px',
            height: '32px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            animation: 'pulse 1.5s infinite'
          }}></div>
        ) : value}
      </div>
      
      <div style={{
        fontSize: '0.9rem',
        color: '#6c757d',
        fontWeight: '500'
      }}>
        {title}
      </div>
      
      {subtitle && (
        <div style={{
          fontSize: '0.7rem',
          color: '#adb5bd',
          marginTop: '0.25rem'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  const QuickActionCard = ({ icon, title, description, onClick, color }) => (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        textAlign: 'center'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderColor = '#e9ecef';
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>
      <div style={{
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#495057',
        marginBottom: '0.5rem'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '0.8rem',
        color: '#6c757d',
        lineHeight: '1.4'
      }}>
        {description}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#495057',
          marginBottom: '0.5rem'
        }}>
          📊 Dashboard Empresarial
        </h2>
        <p style={{
          color: '#6c757d',
          fontSize: '1.1rem'
        }}>
          Estadísticas y acciones rápidas de Global Mobility Solutions
        </p>
      </div>

      {/* Estadísticas principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <StatCard
          icon="📋"
          title="Total Remisiones"
          value={stats.loading ? '' : stats.totalRemisiones.toLocaleString()}
          subtitle="Desde inicio de operaciones"
          color="#007bff"
          trend={8.5}
        />
        
        <StatCard
          icon="⏳"
          title="Pendientes"
          value={stats.loading ? '' : stats.remisionesPendientes.toLocaleString()}
          subtitle="Requieren atención"
          color="#ffc107"
          trend={-12}
        />
        
        <StatCard
          icon="✅"
          title="Completadas"
          value={stats.loading ? '' : stats.remisionesCompletadas.toLocaleString()}
          subtitle="Este mes"
          color="#28a745"
          trend={15.3}
        />
        
        <StatCard
          icon="👥"
          title="Empleados Activos"
          value={stats.loading ? '' : stats.empleadosActivos.toLocaleString()}
          subtitle="Personal operativo"
          color="#17a2b8"
          trend={5.2}
        />
        
        <StatCard
          icon="🔧"
          title="Herramientas"
          value={stats.loading ? '' : stats.herramientasOperativas.toLocaleString()}
          subtitle="Operativas"
          color="#6f42c1"
          trend={2.1}
        />
        
        <StatCard
          icon="💰"
          title="Ventas Mensual"
          value={stats.loading ? '' : formatCurrency(stats.ventasMensual)}
          subtitle="Último mes"
          color="#28a745"
          trend={22.7}
        />
      </div>

      {/* Acciones rápidas */}
      {userRole && ['directivo', 'administrativo'].includes(userRole) && (
        <div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#495057',
            marginBottom: '1.5rem'
          }}>
            ⚡ Acciones Rápidas
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            <QuickActionCard
              icon="📋"
              title="Nueva Remisión"
              description="Crear una nueva orden de trabajo rápidamente"
              color="#007bff"
              onClick={() => {
                // Trigger navigation to ingresar trabajo
                window.dispatchEvent(new CustomEvent('navigation-change', {
                  detail: { module: 'ingresar_trabajo' }
                }));
              }}
            />
            
            <QuickActionCard
              icon="📊"
              title="Ver Historial"
              description="Consultar remisiones y trabajos realizados"
              color="#28a745"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigation-change', {
                  detail: { module: 'historial_trabajos' }
                }));
              }}
            />
            
            <QuickActionCard
              icon="🔧"
              title="Administrar Remisiones"
              description="Gestionar estados y procesos de remisiones"
              color="#ffc107"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigation-change', {
                  detail: { module: 'administrar_remisiones' }
                }));
              }}
            />
            
            <QuickActionCard
              icon="👥"
              title="Gestión Empleados"
              description="Administrar personal y asignaciones"
              color="#17a2b8"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigation-change', {
                  detail: { module: 'empleados' }
                }));
              }}
            />
          </div>
        </div>
      )}

      {/* Estilos para animaciones */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ERPStatsWidget;
