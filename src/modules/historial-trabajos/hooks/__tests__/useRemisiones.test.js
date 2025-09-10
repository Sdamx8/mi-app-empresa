/**
 * Tests unitarios para useRemisiones hook
 * 
 * Casos de prueba:
 * - Estado inicial
 * - Carga de remisiones
 * - Aplicación de filtros
 * - Paginación
 * - Manejo de errores
 * - Actualizaciones en tiempo real
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import useRemisiones from '../useRemisiones';
import { remisionesService } from '../../../services/remisionesService';
import { mockRemisiones, createMockUser } from '../../setupTests';

// Mock del servicio
jest.mock('../../../services/remisionesService');
const mockRemisionesService = remisionesService;

// Mock del contexto de auth
const mockAuthContext = {
  user: createMockUser('administrativo'),
  loading: false
};

jest.mock('../../../../core/auth/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

describe('useRemisiones Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockRemisionesService.fetchRemisiones.mockResolvedValue({
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

      expect(mockRemisionesService.fetchRemisiones).toHaveBeenCalledWith({
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
      
      mockRemisionesService.fetchRemisiones.mockReturnValue(pendingPromise);

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
          total: 3
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    test('debe cargar páginas adicionales correctamente', async () => {
      const { result } = renderHook(() => useRemisiones());

      // Cargar primera página
      await act(async () => {
        await result.current.fetchFirstPage();
      });

      // Mock para segunda página
      const secondPageRemisiones = [
        { id: 'rem-004', numeroRemision: 'REM-004', cliente: 'Cliente 4' }
      ];

      mockRemisionesService.fetchRemisiones.mockResolvedValueOnce({
        remisiones: secondPageRemisiones,
        lastDoc: null,
        hasMore: false,
        total: 50
      });

      // Cargar siguiente página
      await act(async () => {
        await result.current.fetchNextPage();
      });

      expect(result.current.remisiones).toHaveLength(4); // 3 + 1
      expect(result.current.hasMore).toBe(false);
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

      expect(mockRemisionesService.fetchRemisiones).toHaveBeenCalledWith({
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
      expect(mockRemisionesService.fetchRemisiones).toHaveBeenLastCalledWith({
        limit: 20,
        startAfter: null,
        filtros: {},
        userRole: 'administrativo',
        userId: 'test-user-id'
      });
    });

    test('debe reiniciar paginación al aplicar filtros', async () => {
      const { result } = renderHook(() => useRemisiones());

      // Cargar primera página
      await act(async () => {
        await result.current.fetchFirstPage();
      });

      // Simular que hay más páginas
      expect(result.current.hasMore).toBe(true);

      // Aplicar filtros (debe reiniciar)
      await act(async () => {
        await result.current.applyFilters({ estado: 'completado' });
      });

      // Verificar que se reinició la paginación
      expect(mockRemisionesService.fetchRemisiones).toHaveBeenLastCalledWith({
        limit: 20,
        startAfter: null, // Reiniciado
        filtros: { estado: 'completado' },
        userRole: 'administrativo',
        userId: 'test-user-id'
      });
    });
  });

  describe('Manejo de errores', () => {
    test('debe manejar errores de red', async () => {
      const networkError = new Error('Network error');
      mockRemisionesService.fetchRemisiones.mockRejectedValue(networkError);

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
      mockRemisionesService.fetchRemisiones.mockRejectedValueOnce(
        new Error('Initial error')
      );

      await act(async () => {
        await result.current.fetchFirstPage();
      });

      expect(result.current.error).toBeTruthy();

      // Simular consulta exitosa
      mockRemisionesService.fetchRemisiones.mockResolvedValueOnce({
        remisiones: mockRemisiones,
        lastDoc: null,
        hasMore: false,
        total: 3
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

    test('debe refrescar datos correctamente', async () => {
      const { result } = renderHook(() => useRemisiones());

      // Cargar datos iniciales
      await act(async () => {
        await result.current.fetchFirstPage();
      });

      // Limpiar mocks para verificar nueva llamada
      jest.clearAllMocks();

      // Mock para datos actualizados
      const updatedData = {
        remisiones: [...mockRemisiones, { id: 'new-rem', numeroRemision: 'NEW-001' }],
        lastDoc: null,
        hasMore: false,
        total: 4
      };

      mockRemisionesService.fetchRemisiones.mockResolvedValue(updatedData);

      await act(async () => {
        await result.current.refreshData();
      });

      expect(mockRemisionesService.fetchRemisiones).toHaveBeenCalledTimes(1);
      expect(result.current.remisiones).toHaveLength(4);
    });
  });

  describe('Permisos por rol', () => {
    test('debe pasar rol de usuario al servicio', async () => {
      // Mock para usuario técnico
      mockAuthContext.user = createMockUser('tecnico');

      const { result } = renderHook(() => useRemisiones());

      await act(async () => {
        await result.current.fetchFirstPage();
      });

      expect(mockRemisionesService.fetchRemisiones).toHaveBeenCalledWith({
        limit: 20,
        startAfter: null,
        filtros: {},
        userRole: 'tecnico',
        userId: 'test-user-id'
      });
    });

    test('debe manejar usuario sin autenticar', async () => {
      // Mock para usuario no autenticado
      mockAuthContext.user = null;

      const { result } = renderHook(() => useRemisiones());

      await act(async () => {
        await result.current.fetchFirstPage();
      });

      expect(mockRemisionesService.fetchRemisiones).toHaveBeenCalledWith({
        limit: 20,
        startAfter: null,
        filtros: {},
        userRole: null,
        userId: null
      });
    });
  });

  describe('Performance y optimización', () => {
    test('debe evitar múltiples llamadas simultáneas', async () => {
      const { result } = renderHook(() => useRemisiones());

      // Simular múltiples llamadas rápidas
      const promise1 = act(async () => {
        await result.current.fetchFirstPage();
      });

      const promise2 = act(async () => {
        await result.current.fetchFirstPage();
      });

      const promise3 = act(async () => {
        await result.current.fetchFirstPage();
      });

      await Promise.all([promise1, promise2, promise3]);

      // Solo debe haber hecho una llamada al servicio
      expect(mockRemisionesService.fetchRemisiones).toHaveBeenCalledTimes(1);
    });

    test('debe mantener referencia estable de funciones', () => {
      const { result, rerender } = renderHook(() => useRemisiones());

      const initialFunctions = {
        fetchFirstPage: result.current.fetchFirstPage,
        fetchNextPage: result.current.fetchNextPage,
        applyFilters: result.current.applyFilters,
        clearFilters: result.current.clearFilters,
        refreshData: result.current.refreshData,
        updateRemision: result.current.updateRemision
      };

      // Re-render del hook
      rerender();

      // Las funciones deben mantener la misma referencia
      expect(result.current.fetchFirstPage).toBe(initialFunctions.fetchFirstPage);
      expect(result.current.fetchNextPage).toBe(initialFunctions.fetchNextPage);
      expect(result.current.applyFilters).toBe(initialFunctions.applyFilters);
      expect(result.current.clearFilters).toBe(initialFunctions.clearFilters);
      expect(result.current.refreshData).toBe(initialFunctions.refreshData);
      expect(result.current.updateRemision).toBe(initialFunctions.updateRemision);
    });
  });
});
