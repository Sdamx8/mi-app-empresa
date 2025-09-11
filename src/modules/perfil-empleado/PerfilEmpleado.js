// PerfilEmpleado.js - Sistema de personalización basado en roles y permisos
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../core/config/firebaseConfig';
import { useAuth } from '../../core/auth/AuthContext';
import { useRole } from '../../core/auth/RoleContext';
import { getTechnicianStats, getMonthlyWorkSummary } from './services/technicianStatsService';
import { THEME_COLORS, TIPOS_EMPLEADO, ESTADOS_EMPLEADO } from '../../shared/constants';
import NoticiasCompensar from './components/NoticiasCompensar';
import NoticiasTest2 from './components/NoticiasTest2';
import GMSLogo from '../../shared/components/GMSLogo';
import ERPStatsWidget from '../../shared/components/ERPStatsWidget';

// Configuración de módulos y permisos
const MODULES_CONFIG = {
  crm: {
    id: 'crm',
    label: 'CRM Clientes',
    icon: '👥',
    description: 'Gestión de clientes y relaciones',
    color: THEME_COLORS.primary,
    requiredPermissions: ['view_crm'],
    allowedRoles: ['directivo', 'administrativo']
  },
  historial_trabajos: {
    id: 'historial_trabajos',
    label: 'Buscar Historial',
    icon: '🔍',
    description: 'Búsqueda de remisiones y trabajos',
    color: THEME_COLORS.info,
    requiredPermissions: ['view_historial'],
    allowedRoles: ['directivo', 'administrativo', 'tecnico']
  },
  ingresar_trabajo: {
    id: 'ingresar_trabajo',
    label: 'Ingresar Trabajo',
    icon: '🔧',
    description: 'Registrar nuevos trabajos realizados',
    color: THEME_COLORS.success,
    requiredPermissions: ['create_trabajo'],
    allowedRoles: ['directivo', 'administrativo', 'tecnico']
  },
  herramientas_electricas: {
    id: 'herramientas_electricas',
    label: 'Herramientas Eléctricas',
    icon: '⚡',
    description: 'Gestión de herramientas eléctricas',
    color: THEME_COLORS.warning,
    requiredPermissions: ['view_herramientas'],
    allowedRoles: ['directivo', 'administrativo', 'tecnico']
  },
  herramientas_manuales: {
    id: 'herramientas_manuales',
    label: 'Herramientas Manuales',
    icon: '🔨',
    description: 'Gestión de herramientas manuales',
    color: THEME_COLORS.warning,
    requiredPermissions: ['view_herramientas'],
    allowedRoles: ['directivo', 'administrativo', 'tecnico']
  },
  empleados: {
    id: 'empleados',
    label: 'Gestión de Empleados',
    icon: '👤',
    description: 'Administración de recursos humanos',
    color: THEME_COLORS.danger,
    requiredPermissions: ['view_empleados', 'manage_empleados'],
    allowedRoles: ['directivo', 'administrativo']
  },
  reportes: {
    id: 'reportes',
    label: 'Reportes y Analytics',
    icon: '📊',
    description: 'Análisis y reportes empresariales',
    color: THEME_COLORS.dark,
    requiredPermissions: ['view_reportes'],
    allowedRoles: ['directivo', 'administrativo']
  },
  mi_perfil: {
    id: 'mi_perfil',
    label: 'Mi Perfil',
    icon: '👤',
    description: 'Información personal y configuración',
    color: THEME_COLORS.info,
    requiredPermissions: ['view_profile'],
    allowedRoles: ['directivo', 'administrativo', 'tecnico']
  }
};

// Permisos por defecto según el tipo de empleado
const DEFAULT_PERMISSIONS = {
  directivo: [
    'view_crm', 'manage_crm',
    'view_historial', 'manage_historial',
    'create_trabajo', 'edit_trabajo', 'delete_trabajo',
    'view_herramientas', 'manage_herramientas',
    'view_empleados', 'manage_empleados',
    'view_reportes', 'manage_reportes',
    'view_profile', 'edit_profile',
    'admin_access'
  ],
  administrativo: [
    'view_crm', 'manage_crm',
    'view_historial', 'manage_historial',
    'create_trabajo', 'edit_trabajo',
    'view_herramientas', 'manage_herramientas',
    'view_empleados',
    'view_reportes',
    'view_profile', 'edit_profile'
  ],
  tecnico: [
    'view_historial',
    'create_trabajo',
    'view_herramientas',
    'view_profile', 'edit_profile'
  ]
};

// Mensajes motivacionales por tipo de empleado
const MENSAJES_MOTIVACIONALES = {
  directivo: [
    "¡Tu liderazgo guía el rumbo de la empresa!",
    "¡Las decisiones que tomas impulsan el crecimiento!",
    "¡Tu visión estratégica marca la diferencia!",
    "¡Gracias por liderar con ejemplo y dedicación!",
    "¡Hoy es un gran día para alcanzar nuevas metas!"
  ],
  administrativo: [
    "¡Tu organización mantiene todo funcionando perfectamente!",
    "¡El orden y la eficiencia son tu fortaleza!",
    "¡Tu trabajo es el motor que impulsa los procesos!",
    "¡Gracias por mantener la empresa en marcha!",
    "¡Tu dedicación administrativa es invaluable!"
  ],
  tecnico: [
    "¡Tu experiencia técnica resuelve los mayores desafíos!",
    "¡Cada problema que solucionas mejora nuestro servicio!",
    "¡Tu habilidad técnica es clave para el éxito!",
    "¡Gracias por tu conocimiento y profesionalismo!",
    "¡Tu trabajo en campo marca la diferencia!"
  ]
};

function getMensajeMotivacional(tipoEmpleado) {
  const mensajes = MENSAJES_MOTIVACIONALES[tipoEmpleado] || MENSAJES_MOTIVACIONALES.tecnico;
  const idx = Math.floor(Math.random() * mensajes.length);
  return mensajes[idx];
}

const PerfilEmpleado = ({ onModulo }) => {
  const { user } = useAuth();
  const { userRole, currentEmployee } = useRole();
  const [empleado, setEmpleado] = useState(null);
  const [reportesTrabajo, setReportesTrabajo] = useState([]);
  const [herramientasElectricas, setHerramientasElectricas] = useState([]);
  const [herramientasManuales, setHerramientasManuales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para estadísticas del técnico
  const [estadisticasTecnico, setEstadisticasTecnico] = useState(null);
  const [resumenMensual, setResumenMensual] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Obtener información del empleado basada en el email del usuario autenticado
  const fetchEmpleado = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const q = query(
        collection(db, 'EMPLEADOS'), 
        where('contacto.correo', '==', user.email)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const empleadoData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setEmpleado(empleadoData);
      } else {
        setError('No se encontró información del empleado asociada a este email.');
      }
    } catch (error) {
      console.error('Error fetching empleado:', error);
      setError('Error al cargar la información del empleado.');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  // Función para cargar estadísticas del técnico
  const fetchEstadisticasTecnico = useCallback(async () => {
    // Solo cargar estadísticas si el usuario es técnico y tenemos su información
    if (userRole !== 'tecnico' || !currentEmployee?.nombre) return;
    
    try {
      setLoadingStats(true);
      const [stats, resumen] = await Promise.all([
        getTechnicianStats(currentEmployee.nombre),
        getMonthlyWorkSummary(currentEmployee.nombre)
      ]);
      
      setEstadisticasTecnico(stats);
      setResumenMensual(resumen);
    } catch (error) {
      console.error('Error al cargar estadísticas del técnico:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [userRole, currentEmployee?.nombre]);

  // Obtener informes técnicos del empleado (mes actual)
  const fetchReportesTrabajo = useCallback(async () => {
    // Informes técnicos removed from the codebase — keep reportesTrabajo empty
    setReportesTrabajo([]);
  }, []);

  // Obtener herramientas asignadas al empleado
  const fetchHerramientasAsignadas = useCallback(async () => {
    if (!empleado?.nombre_completo) return;
    
    try {
      // Herramientas eléctricas - filtrar por nombre del técnico
      const qElectrica = query(
        collection(db, 'HERRAMIENTA_ELECTRICA'),
        where('tecnico', '==', empleado.nombre_completo)
      );
      const snapshotElectrica = await getDocs(qElectrica);
      setHerramientasElectricas(snapshotElectrica.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Herramientas manuales - filtrar por nombre del técnico
      const qManual = query(
        collection(db, 'HERRAMIENTA_MANUAL'),
        where('tecnico', '==', empleado.nombre_completo)
      );
      const snapshotManual = await getDocs(qManual);
      setHerramientasManuales(snapshotManual.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching herramientas:', error);
      // Si hay error de permisos, establecer arrays vacíos
      setHerramientasElectricas([]);
      setHerramientasManuales([]);
    }
  }, [empleado]);

  useEffect(() => {
    fetchEmpleado();
  }, [fetchEmpleado]);

  useEffect(() => {
    if (empleado) {
      fetchReportesTrabajo();
      fetchHerramientasAsignadas();
    }
  }, [empleado, fetchReportesTrabajo, fetchHerramientasAsignadas]);

  // Cargar estadísticas del técnico si es aplicable
  useEffect(() => {
    fetchEstadisticasTecnico();
  }, [fetchEstadisticasTecnico]);

  // Calcular permisos del empleado
  const empleadoPermissions = useMemo(() => {
    if (!empleado) return [];
    
    // Permisos personalizados del empleado o permisos por defecto según su tipo
    return empleado.permisos_personalizados || DEFAULT_PERMISSIONS[empleado.tipo_empleado] || [];
  }, [empleado]);

  // Filtrar módulos disponibles según permisos y rol
  const modulosDisponibles = useMemo(() => {
    if (!empleado) return [];
    
    return Object.values(MODULES_CONFIG).filter(module => {
      // Verificar si el rol del empleado está permitido
      const roleAllowed = module.allowedRoles.includes(empleado.tipo_empleado);
      
      // Verificar si tiene al menos uno de los permisos requeridos
      const hasPermission = module.requiredPermissions.some(permission => 
        empleadoPermissions.includes(permission)
      );
      
      return roleAllowed && hasPermission;
    });
  }, [empleado, empleadoPermissions]);

  // Obtener información del tipo de empleado
  const tipoEmpleadoInfo = useMemo(() => {
    if (!empleado) return null;
    return TIPOS_EMPLEADO.find(tipo => tipo.value === empleado.tipo_empleado);
  }, [empleado]);

  // Obtener información del estado del empleado
  const estadoEmpleadoInfo = useMemo(() => {
    if (!empleado) return null;
    return ESTADOS_EMPLEADO.find(estado => estado.value === empleado.estado);
  }, [empleado]);

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={loadingSpinnerStyle}>🔄</div>
        <p style={loadingTextStyle}>Cargando perfil del empleado...</p>
      </div>
    );
  }

  if (error || !empleado) {
    return (
      <div style={errorContainerStyle}>
        <div style={errorIconStyle}>❌</div>
        <h3 style={errorTitleStyle}>Error de Acceso</h3>
        <p style={errorMessageStyle}>
          {error || 'No se pudo cargar la información del empleado.'}
        </p>
        <p style={errorHelpStyle}>
          Contacta al administrador del sistema para verificar tu acceso.
        </p>
      </div>
    );
  }

  return (
    <div style={mainContainerStyle} className="fade-in">
      {/* Header del perfil */}
      <div style={headerStyle} className="slide-in-down">
        <div style={welcomeContainerStyle}>
          <h1 style={welcomeTitleStyle}>
            ¡Bienvenido, {empleado.nombre_completo}! 👋
          </h1>
          <p style={motivationalMessageStyle}>
            {getMensajeMotivacional(empleado.tipo_empleado)}
          </p>
        </div>
      </div>

      {/* Logo de la empresa destacado */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '30px',
        margin: '20px 0',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        border: '2px solid #e9ecef',
        textAlign: 'center'
      }} className="slide-in">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px'
        }}>
          <GMSLogo width={100} height={100} />
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1e3c72',
            marginBottom: '5px'
          }}>
            Global Mobility Solutions
          </div>
          <div style={{
            fontSize: '14px',
            color: '#666',
            fontWeight: '500',
            letterSpacing: '1px'
          }}>
            INNOVACIÓN • EFICIENCIA • EXCELENCIA
          </div>
        </div>
      </div>

      {/* Noticias de Compensar según el rol */}
      <NoticiasCompensar 
        userRole={empleado.tipo_empleado} 
        userName={empleado.nombre_completo.split(' ')[0]}
      />

      {/* Widget de estadísticas empresariales */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '0',
        margin: '20px 0',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        border: '2px solid #e9ecef',
        overflow: 'hidden'
      }} className="slide-in-up">
        <ERPStatsWidget />
      </div>


      <div style={contentGridStyle} className="stagger-animation">
        {/* Información del empleado */}
        <div style={infoCardStyle} className="scale-in">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h3 style={{...cardTitleStyle, margin: 0, borderBottom: 'none', paddingBottom: 0}}>
              📋 Información Personal
            </h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: '#f8f9fa',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <GMSLogo width={40} height={40} />
              <div style={{ 
                marginLeft: '10px',
                fontSize: '12px',
                color: '#666',
                fontWeight: '500'
              }}>
                Global Mobility<br/>Solutions
              </div>
            </div>
          </div>
          <div style={{...cardTitleStyle, margin: '0 0 20px 0', fontSize: '1px', height: '2px'}}></div>
          <div style={infoGridStyle}>
            <InfoItem label="Cargo" value={empleado.cargo} />
            <InfoItem label="Identificación" value={empleado.identificacion} />
            <InfoItem 
              label="Tipo" 
              value={tipoEmpleadoInfo?.label} 
              badge={true}
              color={tipoEmpleadoInfo?.color}
            />
            <InfoItem 
              label="Estado" 
              value={estadoEmpleadoInfo?.label}
              badge={true}
              color={estadoEmpleadoInfo?.color}
            />
            <InfoItem label="Fecha Ingreso" value={
              empleado.fecha_ingreso ? 
              new Date(empleado.fecha_ingreso).toLocaleDateString('es-ES') : 
              'No registrada'
            } />
            <InfoItem label="EPS" value={empleado.seguridad_salud?.eps || 'No registrada'} />
            <InfoItem label="ARL" value={empleado.seguridad_salud?.arl || 'No registrada'} />
            <InfoItem label="Teléfono" value={empleado.contacto?.telefono || 'No registrado'} />
          </div>
        </div>

        {/* Herramientas asignadas */}
        <div style={infoCardStyle}>
          <h3 style={cardTitleStyle}>🔧 Herramientas Asignadas</h3>
          
          <div style={herramientasContainerStyle}>
            <div style={herramientasSectionStyle}>
              <h4 style={sectionTitleStyle}>⚡ Eléctricas ({herramientasElectricas.length})</h4>
              {herramientasElectricas.length === 0 ? (
                <p style={noDataStyle}>No tienes herramientas eléctricas asignadas</p>
              ) : (
                <ul style={listStyle}>
                  {herramientasElectricas.slice(0, 3).map((herramienta, index) => (
                    <li key={index} style={listItemStyle}>
                      <strong>{herramienta.internal_serial_number || herramienta.machine_serial}</strong>
                      <br />
                      <small>{herramienta.description}</small>
                    </li>
                  ))}
                  {herramientasElectricas.length > 3 && (
                    <li style={moreItemsStyle}>
                      +{herramientasElectricas.length - 3} más...
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div style={herramientasSectionStyle}>
              <h4 style={sectionTitleStyle}>🔨 Manuales ({herramientasManuales.length})</h4>
              {herramientasManuales.length === 0 ? (
                <p style={noDataStyle}>No tienes herramientas manuales asignadas</p>
              ) : (
                <ul style={listStyle}>
                  {herramientasManuales.slice(0, 3).map((herramienta, index) => (
                    <li key={index} style={listItemStyle}>
                      <strong>{herramienta.internal_code}</strong>
                      <br />
                      <small>{herramienta.description}</small>
                    </li>
                  ))}
                  {herramientasManuales.length > 3 && (
                    <li style={moreItemsStyle}>
                      +{herramientasManuales.length - 3} más...
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Reportes recientes */}
        <div style={infoCardStyle}>
          <h3 style={cardTitleStyle}>📊 Actividad Reciente</h3>
          <h4 style={sectionTitleStyle}>Trabajos del mes actual</h4>
          {reportesTrabajo.length === 0 ? (
            <p style={noDataStyle}>No hay reportes de trabajo este mes</p>
          ) : (
            <ul style={listStyle}>
              {reportesTrabajo.slice(0, 5).map((reporte, index) => (
                <li key={index} style={listItemStyle}>
                  <strong>📅 {reporte.fecha}</strong>
                  <br />
                  <small>{reporte.descripcion || 'Sin descripción'}</small>
                </li>
              ))}
              {reportesTrabajo.length > 5 && (
                <li style={moreItemsStyle}>
                  +{reportesTrabajo.length - 5} reportes más...
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Módulos disponibles */}
      <div style={modulesContainerStyle} className="slide-in-up">
        <h3 style={modulesTitleStyle}>🚀 Módulos Disponibles</h3>
        <p style={modulesSubtitleStyle}>
          Accede a las funcionalidades según tu rol: <strong>{tipoEmpleadoInfo?.label}</strong>
        </p>
        
        <div style={modulesGridStyle} className="stagger-animation">
          {modulosDisponibles.map((module, index) => (
            <div
              key={module.id}
              style={{
                opacity: 0,
                animation: `fadeIn 0.6s ease-out forwards`,
                animationDelay: `${index * 0.15}s`
              }}
            >
              <ModuloButton
                module={module}
                onClick={() => onModulo && onModulo(module.id)}
              />
            </div>
          ))}
        </div>

        {modulosDisponibles.length === 0 && (
          <div style={noModulesStyle}>
            <p>No tienes módulos disponibles con tu rol actual.</p>
            <p>Contacta al administrador para verificar tus permisos.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para mostrar información
const InfoItem = ({ label, value, badge = false, color }) => (
  <div style={infoItemStyle}>
    <label style={infoLabelStyle}>{label}:</label>
    {badge ? (
      <span style={{
        ...infoBadgeStyle,
        backgroundColor: color || THEME_COLORS.primary
      }}>
        {value}
      </span>
    ) : (
      <span style={infoValueStyle}>{value}</span>
    )}
  </div>
);

// Componente para botones de módulos
const ModuloButton = ({ module, onClick }) => (
  <button
    style={{
      ...moduleButtonStyle,
      backgroundColor: module.color,
      borderColor: module.color,
      position: 'relative',
      overflow: 'hidden'
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.target.style.transform = 'translateY(-8px) scale(1.05)';
      e.target.style.boxShadow = `0 12px 30px ${module.color}50`;
      // Efecto de brillo
      const shine = e.target.querySelector('.shine-effect');
      if (shine) {
        shine.style.left = '120%';
      }
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'translateY(0) scale(1)';
      e.target.style.boxShadow = `0 4px 12px ${module.color}30`;
      // Reset del brillo
      const shine = e.target.querySelector('.shine-effect');
      if (shine) {
        shine.style.left = '-120%';
      }
    }}
  >
    {/* Efecto de brillo en hover */}
    <div 
      className="shine-effect"
      style={{
        position: 'absolute',
        top: 0,
        left: '-120%',
        width: '50%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        transition: 'left 0.6s ease-out',
        pointerEvents: 'none'
      }}
    />
    
    <div style={moduleIconStyle}>{module.icon}</div>
    <div style={moduleLabelStyle}>{module.label}</div>
    <div style={moduleDescStyle}>{module.description}</div>
  </button>
);

// Estilos
const mainContainerStyle = {
  padding: '20px',
  maxWidth: '1400px',
  margin: '0 auto',
  backgroundColor: '#f8f9fa'
};

const headerStyle = {
  background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.info} 100%)`,
  borderRadius: '16px',
  padding: '30px',
  marginBottom: '30px',
  color: 'white',
  textAlign: 'center',
  boxShadow: '0 8px 32px rgba(0,123,255,0.3)'
};

const welcomeContainerStyle = {
  maxWidth: '800px',
  margin: '0 auto'
};

const welcomeTitleStyle = {
  margin: '0 0 15px 0',
  fontSize: '2.5em',
  fontWeight: 'bold',
  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
};

const motivationalMessageStyle = {
  fontSize: '1.3em',
  fontWeight: '500',
  margin: 0,
  opacity: 0.95
};

const contentGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gap: '20px',
  marginBottom: '30px'
};

const infoCardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '25px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  border: '1px solid #e9ecef'
};

const cardTitleStyle = {
  margin: '0 0 20px 0',
  color: THEME_COLORS.primary,
  fontSize: '1.4em',
  fontWeight: 'bold',
  borderBottom: `2px solid ${THEME_COLORS.primary}`,
  paddingBottom: '10px'
};

const infoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '15px'
};

const infoItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
};

const infoLabelStyle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666',
  textTransform: 'uppercase'
};

const infoValueStyle = {
  fontSize: '16px',
  color: '#333',
  fontWeight: '500'
};

const infoBadgeStyle = {
  color: 'white',
  padding: '4px 12px',
  borderRadius: '20px',
  fontSize: '14px',
  fontWeight: 'bold',
  textAlign: 'center',
  alignSelf: 'flex-start'
};

const herramientasContainerStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '20px'
};

const herramientasSectionStyle = {
  backgroundColor: '#f8f9fa',
  padding: '15px',
  borderRadius: '8px',
  border: '1px solid #dee2e6'
};

const sectionTitleStyle = {
  margin: '0 0 15px 0',
  color: THEME_COLORS.dark,
  fontSize: '1.1em'
};

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0
};

const listItemStyle = {
  backgroundColor: 'white',
  padding: '10px',
  marginBottom: '8px',
  borderRadius: '6px',
  border: '1px solid #e9ecef',
  fontSize: '14px'
};

const moreItemsStyle = {
  ...listItemStyle,
  fontStyle: 'italic',
  color: '#666',
  textAlign: 'center'
};

const noDataStyle = {
  color: '#666',
  fontStyle: 'italic',
  textAlign: 'center',
  margin: '20px 0'
};

const modulesContainerStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '30px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
};

const modulesTitleStyle = {
  margin: '0 0 10px 0',
  color: THEME_COLORS.primary,
  fontSize: '1.8em',
  textAlign: 'center'
};

const modulesSubtitleStyle = {
  textAlign: 'center',
  color: '#666',
  marginBottom: '30px'
};

const modulesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '20px'
};

const moduleButtonStyle = {
  background: 'white',
  border: '2px solid',
  borderRadius: '12px',
  padding: '20px',
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  transform: 'translateY(0) scale(1)',
  willChange: 'transform, box-shadow',
  backfaceVisibility: 'hidden'
};

const moduleIconStyle = {
  fontSize: '2.5em',
  marginBottom: '10px'
};

const moduleLabelStyle = {
  fontSize: '1.2em',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '8px'
};

const moduleDescStyle = {
  fontSize: '0.9em',
  color: '#666',
  lineHeight: '1.4'
};

const noModulesStyle = {
  textAlign: 'center',
  color: '#666',
  padding: '40px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '2px dashed #dee2e6'
};

const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '400px',
  textAlign: 'center'
};

const loadingSpinnerStyle = {
  fontSize: '3em',
  animation: 'spin 1s linear infinite'
};

const loadingTextStyle = {
  fontSize: '1.2em',
  color: '#666',
  marginTop: '20px'
};

const errorContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '400px',
  textAlign: 'center',
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  margin: '20px',
  padding: '40px'
};

const errorIconStyle = {
  fontSize: '4em',
  marginBottom: '20px'
};

const errorTitleStyle = {
  color: THEME_COLORS.danger,
  margin: '0 0 15px 0'
};

const errorMessageStyle = {
  color: '#666',
  fontSize: '1.1em',
  marginBottom: '10px'
};

const errorHelpStyle = {
  color: '#999',
  fontSize: '0.9em'
};

export default PerfilEmpleado;
