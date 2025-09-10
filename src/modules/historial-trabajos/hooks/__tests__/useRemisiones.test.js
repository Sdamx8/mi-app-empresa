/**
 * Tests unitarios para useRemisiones hook
 * 
 * Casos de prueba:
 * - Estado inicial
 * - Carga de remisiones
 * - Aplicación de filtros
 * - Paginación
 * - Manejo de errores
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import useRemisiones from '../useRemisiones';

// Mock del servicio directamente
const mockFetchRemisiones = jest.fn();
const mockFetchHistorialRemision = jest.fn();

jest.mock('../../../../services/remisionesService', () => ({
  fetchRemisiones: mockFetchRemisiones,
  fetchHistorialRemision: mockFetchHistorialRemision,
  fetchAllRemisionesForExport: jest.fn(),
}));

// Mock del contexto de auth
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  customClaims: { role: 'administrativo' }
};

jest.mock('../../../../core/auth/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: mockUser,
    loading: false
  }))
}));

// Datos de prueba
const mockRemisiones = [
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
  }
];

describe('useRemisiones Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockFetchRemisiones.mockResolvedValue({
      remisiones: mockRemisiones,
      lastDoc: { id: 'last-doc' },
      hasMore: true,
      total: 50
    });
  });

  describe('Estado inicial', () => {
    test('debe inicializar con valores por defecto', () => {
      const { result } = renderHook(() => useRemisiones());

      expect(result.current.remisiones).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.filtros).toEqual({});
      expect(result.current.total).toBe(0);
    });

    test('debe tener funciones disponibles', () => {
      const { result } = renderHook(() => useRemisiones());

      expect(typeof result.current.fetchFirstPage).toBe('function');
      expect(typeof result.current.fetchNextPage).toBe('function');
      expect(typeof result.current.applyFilters).toBe('function');
      expect(typeof result.current.clearFilters).toBe('function');
      expect(typeof result.current.refreshData).toBe('function');
      expect(typeof result.current.updateRemision).toBe('function');
    });
  });

  describe('Carga de datos', () => {
    test('debe cargar la primera página correctamente', async () => {
      const { result } = renderHook(() => useRemisiones());

      await act(async () => {
        await result.current.fetchFirstPage();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetchRemisiones).toHaveBeenCalledWith({
        limit: 20,
        startAfter: null,
        filtros: {},
        userRole: 'administrativo',
        userId: 'test-user-id'
      });

      expect(result.current.remisiones).toEqual(mockRemisiones);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.total).toBe(50);
      expect(result.current.error).toBe(null);
    });

    test('debe manejar estados de carga correctamente', async () => {
      let resolvePromise;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockFetchRemisiones.mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useRemisiones());

      act(() => {
        result.current.fetchFirstPage();
      });

      // Debe estar en estado de carga
      expect(result.current.loading).toBe(true);

      // Resolver la promesa
      await act(async () => {
        resolvePromise({
          remisiones: mockRemisiones,
          lastDoc: null,
          hasMore: false,
          total: 2
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Filtros', () => {
    test('debe aplicar filtros correctamente', async () => {
      const { result } = renderHook(() => useRemisiones());

      const filtros = {
        texto: 'Cliente Test',
        estado: 'completado',
        fechaDesde: '2024-12-01',
        fechaHasta: '2024-12-31'
      };

      await act(async () => {
        await result.current.applyFilters(filtros);
      });

      expect(mockFetchRemisiones).toHaveBeenCalledWith({
        limit: 20,
        startAfter: null,
        filtros,
        userRole: 'administrativo',
        userId: 'test-user-id'
      });

      expect(result.current.filtros).toEqual(filtros);
    });

    test('debe limpiar filtros correctamente', async () => {
      const { result } = renderHook(() => useRemisiones());

      // Aplicar filtros primero
      await act(async () => {
        await result.current.applyFilters({ texto: 'test' });
      });

      expect(result.current.filtros).toEqual({ texto: 'test' });

      // Limpiar filtros
      await act(async () => {
        await result.current.clearFilters();
      });

      expect(result.current.filtros).toEqual({});
    });
  });

  describe('Manejo de errores', () => {
    test('debe manejar errores de red', async () => {
      const networkError = new Error('Network error');
      mockFetchRemisiones.mockRejectedValue(networkError);

      const { result } = renderHook(() => useRemisiones());

      await act(async () => {
        await result.current.fetchFirstPage();
      });

      await waitFor(() => {
        expect(result.current.error).toBe(networkError);
        expect(result.current.loading).toBe(false);
        expect(result.current.remisiones).toEqual([]);
      });
    });

    test('debe limpiar errores al hacer nueva consulta exitosa', async () => {
      const { result } = renderHook(() => useRemisiones());

      // Simular error inicial
      mockFetchRemisiones.mockRejectedValueOnce(
        new Error('Initial error')
      );

      await act(async () => {
        await result.current.fetchFirstPage();
      });

      expect(result.current.error).toBeTruthy();

      // Simular consulta exitosa
      mockFetchRemisiones.mockResolvedValueOnce({
        remisiones: mockRemisiones,
        lastDoc: null,
        hasMore: false,
        total: 2
      });

      await act(async () => {
        await result.current.refreshData();
      });

      await waitFor(() => {
        expect(result.current.error).toBe(null);
        expect(result.current.remisiones).toEqual(mockRemisiones);
      });
    });
  });

  describe('Actualizaciones', () => {
    test('debe actualizar remisión existente', async () => {
      const { result } = renderHook(() => useRemisiones());

      // Cargar datos iniciales
      await act(async () => {
        await result.current.fetchFirstPage();
      });

      const updatedRemision = {
        ...mockRemisiones[0],
        estado: 'finalizado',
        observaciones: 'Trabajo finalizado'
      };

      act(() => {
        result.current.updateRemision('rem-001', updatedRemision);
      });

      const updatedRemisiones = result.current.remisiones;
      expect(updatedRemisiones[0]).toEqual(updatedRemision);
      expect(updatedRemisiones[1]).toEqual(mockRemisiones[1]); // Sin cambios
    });
  });
});
