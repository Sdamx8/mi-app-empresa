/**
 * Jest setup file for Historial de Trabajos testing
 * Configura el entorno de testing con mocks y utilidades
 */

import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  onSnapshot: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock servicios
jest.mock('../../services/remisionesService', () => ({
  fetchRemisiones: jest.fn(),
  fetchHistorialRemision: jest.fn(),
  fetchAllRemisionesForExport: jest.fn(),
}));

// Mock contextos
jest.mock('../../core/auth/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
      customClaims: { role: 'administrativo' }
    },
    loading: false
  }))
}));

// Datos de prueba para remisiones
export const mockRemisiones = [
  {
    id: 'rem-001',
    numeroRemision: 'REM-001',
    fecha: '2024-12-01',
    cliente: 'Cliente Test 1',
    movil: 'MOV-001',
    estado: 'completado',
    servicios: ['Servicio 1', 'Servicio 2'],
    tecnicos: ['Juan Pérez', 'María García'],
    total: 250000,
    observaciones: 'Trabajo completado satisfactoriamente'
  },
  {
    id: 'rem-002',
    numeroRemision: 'REM-002',
    fecha: '2024-12-02',
    cliente: 'Cliente Test 2',
    movil: 'MOV-002',
    estado: 'proceso',
    servicios: ['Servicio 3'],
    tecnicos: ['Carlos López'],
    total: 150000,
    observaciones: 'En proceso de ejecución'
  },
  {
    id: 'rem-003',
    numeroRemision: 'REM-003',
    fecha: '2024-12-03',
    cliente: 'Cliente Test 3',
    movil: 'MOV-003',
    estado: 'pendiente',
    servicios: ['Servicio 4', 'Servicio 5'],
    tecnicos: ['Ana Rodríguez'],
    total: 320000,
    observaciones: 'Pendiente de inicio'
  }
];

// Datos de prueba para historial
export const mockHistorial = [
  {
    id: 'hist-001',
    fecha: '2024-12-01T10:00:00Z',
    tecnico: 'Juan Pérez',
    actividad: 'Inicio de trabajo',
    descripcion: 'Se inició el trabajo de mantenimiento',
    materiales: ['Material 1', 'Material 2'],
    tiempoInvertido: 120
  },
  {
    id: 'hist-002',
    fecha: '2024-12-01T14:00:00Z',
    tecnico: 'Juan Pérez',
    actividad: 'Trabajo en progreso',
    descripcion: 'Realizando reparaciones principales',
    materiales: ['Material 3'],
    tiempoInvertido: 180
  },
  {
    id: 'hist-003',
    fecha: '2024-12-01T16:30:00Z',
    tecnico: 'María García',
    actividad: 'Finalización',
    descripcion: 'Trabajo completado y verificado',
    materiales: [],
    tiempoInvertido: 60
  }
];

// Utilidades de testing
export const createMockUser = (role = 'administrativo', overrides = {}) => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  customClaims: { role },
  ...overrides
});

export const createMockRemision = (overrides = {}) => ({
  id: 'test-rem-id',
  numeroRemision: 'TEST-001',
  fecha: '2024-12-01',
  cliente: 'Cliente Test',
  movil: 'MOV-TEST',
  estado: 'completado',
  servicios: ['Servicio Test'],
  tecnicos: ['Técnico Test'],
  total: 100000,
  observaciones: 'Test remision',
  ...overrides
});

// Mock console methods para tests limpios
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock para IntersectionObserver (para testing de lazy loading)
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock para ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock para window.matchMedia (para responsive testing)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
