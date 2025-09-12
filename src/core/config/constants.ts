// Configuración de Firebase
export const FIREBASE_CONFIG = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
} as const;

// Configuración de la aplicación
export const APP_CONFIG = {
  name: 'Global Mobility Solutions',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  apiUrl: process.env.REACT_APP_API_URL || '',
} as const;

// Configuración de rutas
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  EMPLEADOS: '/empleados',
  REMISIONES: '/remisiones',
  SERVICIOS: '/servicios',
  INFORMES: '/informes',
  HERRAMIENTAS_ELECTRICAS: '/herramientas-electricas',
  HERRAMIENTAS_MANUALES: '/herramientas-manuales',
  HISTORIAL_TRABAJOS: '/historial-trabajos',
  PERFIL_EMPLEADO: '/perfil-empleado',
  CRM: '/crm',
  FINANCIERO: '/financiero',
} as const;