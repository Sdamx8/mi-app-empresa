/**
 * 🔔 SISTEMA DE NOTIFICACIONES AVANZADO
 * ===================================
 * Componente para gestionar notificaciones en tiempo real del sistema ERP
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import { useRole } from '../../core/auth/RoleContext';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [showCenter, setShowCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { userRole } = useRole();

  // Simulación de notificaciones del sistema
  const generateSystemNotifications = useCallback(() => {
    const now = new Date();
    const systemNotifications = [
      {
        id: 'sys_1',
        type: 'success',
        title: '✅ Módulo AdministrarRemisiones Disponible',
        message: 'El nuevo módulo para administrar remisiones ya está listo para usar.',
        timestamp: new Date(now.getTime() - 5 * 60000), // 5 minutos atrás
        read: false,
        priority: 'high'
      },
      {
        id: 'sys_2',
        type: 'info',
        title: '📊 Reporte Semanal Disponible',
        message: 'El reporte de actividades de la semana pasada está listo para revisar.',
        timestamp: new Date(now.getTime() - 30 * 60000), // 30 minutos atrás
        read: false,
        priority: 'medium'
      },
      {
        id: 'sys_3',
        type: 'warning',
        title: '⚠️ Mantenimiento Programado',
        message: 'Mantenimiento del sistema programado para el próximo domingo a las 2:00 AM.',
        timestamp: new Date(now.getTime() - 60 * 60000), // 1 hora atrás
        read: false,
        priority: 'medium'
      }
    ];

    // Agregar notificaciones específicas por rol
    if (userRole === 'directivo') {
      systemNotifications.push({
        id: 'dir_1',
        type: 'info',
        title: '👥 Nuevos Empleados Pendientes',
        message: '3 solicitudes de empleados esperan aprobación.',
        timestamp: new Date(now.getTime() - 120 * 60000), // 2 horas atrás
        read: false,
        priority: 'high'
      });
    }

    setNotifications(systemNotifications);
    setUnreadCount(systemNotifications.filter(n => !n.read).length);
  }, [userRole]);

  useEffect(() => {
    generateSystemNotifications();
  }, [generateSystemNotifications]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': 
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      case 'error': return '#dc3545';
      case 'info': 
      default: return '#17a2b8';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Botón de notificaciones */}
      <button
        onClick={() => setShowCenter(!showCenter)}
        style={{
          position: 'relative',
          backgroundColor: 'transparent',
          border: 'none',
          color: '#495057',
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '50%',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
        }}
        title="Centro de Notificaciones"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            backgroundColor: '#dc3545',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '0.7rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            border: '2px solid white'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {showCenter && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          width: '400px',
          maxHeight: '500px',
          backgroundColor: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          zIndex: 1000,
          overflow: 'hidden',
          animation: 'slideInDown 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#495057'
            }}>
              🔔 Notificaciones
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#007bff',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px'
                }}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#6c757d'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                <p>No hay notificaciones</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #f8f9fa',
                    cursor: 'pointer',
                    backgroundColor: notification.read ? '#ffffff' : '#f0f8ff',
                    borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.read ? '#ffffff' : '#f0f8ff';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: notification.read ? '500' : '600',
                        color: notification.read ? '#6c757d' : '#495057',
                        marginBottom: '0.25rem',
                        fontSize: '0.9rem'
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#6c757d',
                        marginBottom: '0.5rem',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#adb5bd',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{formatTimeAgo(notification.timestamp)}</span>
                        {!notification.read && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#007bff',
                            borderRadius: '50%'
                          }}></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '0.75rem',
            borderTop: '1px solid #e9ecef',
            backgroundColor: '#f8f9fa',
            textAlign: 'center'
          }}>
            <button
              onClick={() => setShowCenter(false)}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#0056b3';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#007bff';
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Estilos para animación */}
      <style>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationCenter;
