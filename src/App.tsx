import React from 'react';
import Dashboard from './Dashboard';
import LoginPage from './LoginPage';
import { AuthProvider, useAuth } from './core/auth/AuthContext';
import { RoleProvider } from './core/auth/RoleContext';

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

// Error Boundary Component
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('Error en App:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo || { componentStack: 'No disponible' }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <h1 style={{ color: '#dc3545', marginBottom: '1rem' }}>
              ⚠️ Error en la Aplicación
            </h1>
            <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
              Ocurrió un error inesperado. Por favor, recarga la página.
            </p>
            <details style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Detalles técnicos
              </summary>
              <pre style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.8rem',
                marginTop: '0.5rem'
              }}>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🔄 Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%)',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Cargando Global Mobility Solutions...</p>
        </div>
      </div>
    );
  }

  try {
    return user ? <Dashboard /> : <LoginPage />;
  } catch (error) {
    console.error('Error rendering AppContent:', error);
    throw error;
  }
};

const App: React.FC = () => {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <RoleProvider>
          <div className="App">
            <AppContent />
          </div>
        </RoleProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
};

export default App;