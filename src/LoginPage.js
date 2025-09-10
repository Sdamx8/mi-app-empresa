import React, { useState } from 'react';

import { useAuth } from './AuthContext';
import GMSLogo from './GMSLogo';
import BuscarHistorialOptimizado from './BuscarHistorialOptimizado';

import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPublicSearch, setShowPublicSearch] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (error) {
      setError('Credenciales inválidas. Por favor, verifica tu información.');
    } finally {
      setLoading(false);
    }
  };

  // Si está mostrando la búsqueda pública, mostrar solo eso
  if (showPublicSearch) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        {/* Header con botón de regreso */}
        <div style={{
          backgroundColor: '#1e3c72',
          color: 'white',
          padding: '15px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={() => setShowPublicSearch(false)}
            style={{
              backgroundColor: 'transparent',
              border: '2px solid white',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ← Volver al Login
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Global Mobility Solutions</h1>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Consulta Pública de Historial</p>
          </div>
        </div>
        
        {/* Componente de búsqueda sin autenticación */}
        <BuscarHistorialOptimizado 
          canEdit={false} 
          canDelete={false} 
          userRole="publico" 
          requireAuth={false} 
        />
      </div>
    );
  }

  return (
    <div className="login-container">
      {/* Fondo animado */}
      <div className="background-animation">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="login-content">
        {/* Panel izquierdo - Formulario de login PRIMERO */}
        <div className="login-panel">
          <div className="login-form-container">
            <div className="login-header">
              <h3>🔑 Iniciar Sesión</h3>
              <p>Accede a la plataforma y continúa con tus actividades</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Correo Electrónico</label>
                <div className="input-container">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu.email@gms.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <div className="input-container">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="login-button"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <span className="button-icon">🚀</span>
                    Acceder a la Plataforma
                  </>
                )}
              </button>

              {/* Separador visual */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '20px 0',
                textAlign: 'center'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e9ecef' }}></div>
                <span style={{ 
                  padding: '0 15px', 
                  fontSize: '12px', 
                  color: '#6c757d',
                  fontWeight: 'bold'
                }}>
                  O CONSULTA SIN REGISTRO
                </span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e9ecef' }}></div>
              </div>

              {/* Botón para consulta pública - DESPUÉS del login */}
              <button 
                type="button" 
                className="public-search-button"
                onClick={() => setShowPublicSearch(!showPublicSearch)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>🔍</span>
                Consultar Historial (Sin autenticación)
              </button>
            </form>

            <div className="login-footer">
              <div className="security-info">
                <span className="security-icon">🔐</span>
                <p>Conexión segura y encriptada</p>
              </div>
              
              {/* Usuarios de prueba */}
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{
                  fontSize: '0.9rem',
                  color: '#6c757d',
                  marginBottom: '10px',
                  textAlign: 'center'
                }}>
                  ⚙️ Sistema de Roles Automático
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#6c757d', lineHeight: '1.4' }}>
                  <div>✅ Los roles se asignan automáticamente según el campo &quot;Tipo de Empleado&quot; en el módulo de gestión</div>
                  <div style={{ marginTop: '8px' }}>
                    <strong>📊 Usuarios de Prueba:</strong>
                  </div>
                  <div><strong>🎯 Director:</strong> director@gms.com</div>
                  <div><strong>👔 Administrativo:</strong> admin@gms.com</div>
                  <div><strong>👷‍♂️ Técnico:</strong> tecnico@gms.com</div>
                  <div style={{ marginTop: '8px', fontStyle: 'italic', textAlign: 'center' }}>
                    Contraseña: <strong>123456</strong> (para todos)
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '0.75rem', textAlign: 'center', fontStyle: 'italic', color: '#28a745' }}>
                    💡 Para agregar usuarios reales, ve al módulo &quot;Empleados&quot; y asegúrate de incluir el email en el campo &quot;Correo Electrónico&quot;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho - Información corporativa */}
        <div className="info-panel">
          <div className="company-branding">
            <div className="logo-container">
              <div className="corporate-logo">
                <div className="logo-icon" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '30px',
                  padding: '40px',
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  border: '3px solid #1e3c72',
                  boxShadow: '0 10px 30px rgba(30,60,114,0.2)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                }}>
                  <GMSLogo width={150} height={150} className="animate-pulse" />
                </div>
                <div className="logo-text">
                  <h1>Global Mobility Solutions</h1>
                  <p className="tagline">Innovación • Eficiencia • Excelencia</p>
                </div>
              </div>
            </div>

            <div className="welcome-content">
              <h2 className="welcome-title">
                🌐 Bienvenido a Global Mobility Solutions
              </h2>
              
              <div className="company-description">
                <p>
                  En <strong>Global Mobility Solutions (GMS)</strong> trabajamos día a día para 
                  ofrecer soluciones que impulsan el crecimiento y fortalecen nuestro compromiso 
                  con la industria y con nuestros aliados.
                </p>
                
                <p>
                  Esta aplicación ha sido diseñada como una herramienta integral para todo nuestro 
                  equipo: técnicos, administrativos y directivos. Aquí encontrarás los módulos y 
                  recursos necesarios para facilitar la gestión de procesos, optimizar la comunicación 
                  y apoyar la toma de decisiones.
                </p>
                
                <p>
                  Nuestro objetivo es que cada área de la empresa cuente con un espacio digital que 
                  promueva la eficiencia, la colaboración y la innovación.
                </p>
              </div>

              <div className="features-list">
                <div className="feature-item">
                  <span className="feature-icon">⚡</span>
                  <span>Gestión eficiente de procesos</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🤝</span>
                  <span>Comunicación optimizada</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Apoyo en toma de decisiones</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🚀</span>
                  <span>Innovación continua</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de versión */}
      <div className="version-info">
        <p>GMS Platform v2.0 | © 2025 Global Mobility Solutions</p>
      </div>
    </div>
  );
};

export default LoginPage;
