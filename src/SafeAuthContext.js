import React, { createContext, useContext, useState, useEffect } from 'react';

// Contexto de autenticación defensivo
const SafeAuthContext = createContext(null);

// Hook useAuth más defensivo
export const useSafeAuth = () => {
  try {
    const context = useContext(SafeAuthContext);
    if (!context) {
      // Retornar valores por defecto seguros en lugar de lanzar error
      return {
        user: null,
        loading: false,
        login: async () => { throw new Error('Auth not available'); },
        logout: async () => { throw new Error('Auth not available'); }
      };
    }
    return context;
  } catch (error) {
    console.error('Error in useSafeAuth:', error);
    return {
      user: null,
      loading: false,
      login: async () => { throw new Error('Auth error'); },
      logout: async () => { throw new Error('Auth error'); }
    };
  }
};

// Provider más defensivo
export const SafeAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Implementación simple sin Firebase para evitar errores
  const login = async (email, password) => {
    try {
      // Simulación de login para testing
      console.log('Login attempt:', email);
      setUser({ email, uid: 'test-uid' });
      return { user: { email, uid: 'test-uid' } };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <SafeAuthContext.Provider value={value}>
      {children}
    </SafeAuthContext.Provider>
  );
};

export default SafeAuthContext;
