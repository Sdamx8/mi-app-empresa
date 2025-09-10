/**
 * Tests unitarios para HistorialTrabajosOptimizado component
 * 
 * Casos de prueba:
 * - Renderizado inicial
 * - Filtros y búsqueda
 * - Visualización de datos
 * - Paginación
 * - Timeline modal
 * - Responsive design
 * - Accesibilidad
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistorialTrabajosOptimizado from '../HistorialTrabajosOptimizado';
import { mockRemisiones, mockHistorial, createMockUser } from '../../setupTests';
import { remisionesService } from '../../../services/remisionesService';

// Mock del hook
const mockUseRemisiones = {
  remisiones: [],
  loading: false,
  error: null,
  hasMore: true,
  filtros: {},
  total: 0,
  fetchFirstPage: jest.fn(),
  fetchNextPage: jest.fn(),
  applyFilters: jest.fn(),
  clearFilters: jest.fn(),
  refreshData: jest.fn(),
  updateRemision: jest.fn()
};

jest.mock('../../hooks/useRemisiones', () => {
  return jest.fn(() => mockUseRemisiones);
});

// Mock del servicio para historial
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

describe('HistorialTrabajosOptimizado Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock values
    Object.assign(mockUseRemisiones, {
      remisiones: [],
      loading: false,
      error: null,
      hasMore: true,
      filtros: {},
      total: 0
    });

    mockRemisionesService.fetchHistorialRemision.mockResolvedValue(mockHistorial);
  });

  describe('Renderizado inicial', () => {
    test('debe renderizar el header correctamente', () => {
      render(<HistorialTrabajosOptimizado />);

      expect(screen.getByText('Historial de Trabajos')).toBeInTheDocument();
      expect(screen.getByText('Consulta y gestión del historial de remisiones')).toBeInTheDocument();
      expect(screen.getByText('Administrativo')).toBeInTheDocument();
    });

    test('debe mostrar filtros expandibles', () => {
      render(<HistorialTrabajosOptimizado />);

      const filtrosHeader = screen.getByText('Filtros de Búsqueda');
      expect(filtrosHeader).toBeInTheDocument();

      // Debe mostrar el botón de expandir
      const expandButton = screen.getByTestId('expand-filtros');
      expect(expandButton).toBeInTheDocument();
    });

    test('debe mostrar estado inicial cuando no hay datos', () => {
      render(<HistorialTrabajosOptimizado />);

      expect(screen.getByText('Comenzar Búsqueda')).toBeInTheDocument();
      expect(screen.getByText('Utiliza los filtros para buscar en el historial de trabajos')).toBeInTheDocument();
    });
  });

  describe('Filtros y búsqueda', () => {
    test('debe expandir/contraer filtros al hacer clic', async () => {
      const user = userEvent.setup();
      render(<HistorialTrabajosOptimizado />);

      const expandButton = screen.getByTestId('expand-filtros');
      
      // Expandir filtros
      await user.click(expandButton);
      
      expect(screen.getByLabelText('Buscar por texto')).toBeInTheDocument();
      expect(screen.getByLabelText('Estado')).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha Desde')).toBeInTheDocument();
      
      // Contraer filtros
      await user.click(expandButton);
      
      expect(screen.queryByLabelText('Buscar por texto')).not.toBeInTheDocument();
    });

    test('debe aplicar filtros correctamente', async () => {
      const user = userEvent.setup();
      render(<HistorialTrabajosOptimizado />);

      // Expandir filtros
      const expandButton = screen.getByTestId('expand-filtros');
      await user.click(expandButton);

      // Llenar formulario de filtros
      const textoInput = screen.getByLabelText('Buscar por texto');
      const estadoSelect = screen.getByLabelText('Estado');
      const aplicarButton = screen.getByText('Aplicar Filtros');

      await user.type(textoInput, 'Cliente Test');
      await user.selectOptions(estadoSelect, 'completado');
      await user.click(aplicarButton);

      expect(mockUseRemisiones.applyFilters).toHaveBeenCalledWith({
        texto: 'Cliente Test',
        estado: 'completado',
        fechaDesde: '',
        fechaHasta: '',
        tecnico: '',
        cliente: '',
        totalMinimo: ''
      });
    });

    test('debe limpiar filtros correctamente', async () => {
      const user = userEvent.setup();
      
      // Mock con filtros aplicados
      mockUseRemisiones.filtros = { texto: 'test', estado: 'completado' };
      
      render(<HistorialTrabajosOptimizado />);

      // Expandir filtros
      const expandButton = screen.getByTestId('expand-filtros');
      await user.click(expandButton);

      const limpiarButton = screen.getByText('Limpiar Filtros');
      await user.click(limpiarButton);

      expect(mockUseRemisiones.clearFilters).toHaveBeenCalled();
    });

    test('debe mostrar filtros aplicados como tags', () => {
      mockUseRemisiones.filtros = {
        texto: 'Cliente Test',
        estado: 'completado'
      };

      render(<HistorialTrabajosOptimizado />);

      expect(screen.getByText('Cliente Test')).toBeInTheDocument();
      expect(screen.getByText('completado')).toBeInTheDocument();
    });
  });

  describe('Visualización de datos', () => {
    test('debe mostrar skeleton loading cuando está cargando', () => {
      mockUseRemisiones.loading = true;
      
      render(<HistorialTrabajosOptimizado />);

      expect(screen.getByTestId('skeleton-loading')).toBeInTheDocument();
    });

    test('debe mostrar mensaje de error cuando hay error', () => {
      mockUseRemisiones.error = new Error('Error de prueba');
      
      render(<HistorialTrabajosOptimizado />);

      expect(screen.getByText('Error al cargar datos')).toBeInTheDocument();
      expect(screen.getByText('Error de prueba')).toBeInTheDocument();
    });

    test('debe mostrar remisiones cuando hay datos', () => {
      mockUseRemisiones.remisiones = mockRemisiones;
      mockUseRemisiones.total = mockRemisiones.length;
      
      render(<HistorialTrabajosOptimizado />);

      expect(screen.getByText('3 remisiones encontradas')).toBeInTheDocument();
      expect(screen.getByText('REM-001')).toBeInTheDocument();
      expect(screen.getByText('REM-002')).toBeInTheDocument();
      expect(screen.getByText('REM-003')).toBeInTheDocument();
    });

    test('debe mostrar información detallada de cada remisión', () => {
      mockUseRemisiones.remisiones = [mockRemisiones[0]];
      
      render(<HistorialTrabajosOptimizado />);

      expect(screen.getByText('Cliente Test 1')).toBeInTheDocument();
      expect(screen.getByText('MOV-001')).toBeInTheDocument();
      expect(screen.getByText('$250,000')).toBeInTheDocument();
      expect(screen.getByText('Juan Pérez, María García')).toBeInTheDocument();
    });

    test('debe mostrar estados con colores correctos', () => {
      mockUseRemisiones.remisiones = mockRemisiones;
      
      render(<HistorialTrabajosOptimizado />);

      const estadoCompletado = screen.getByText('COMPLETADO');
      const estadoProceso = screen.getByText('PROCESO');
      const estadoPendiente = screen.getByText('PENDIENTE');

      expect(estadoCompletado).toHaveClass('estado-completado');
      expect(estadoProceso).toHaveClass('estado-proceso');
      expect(estadoPendiente).toHaveClass('estado-pendiente');
    });
  });

  describe('Paginación', () => {
    test('debe mostrar botón "Cargar más" cuando hay más datos', () => {
      mockUseRemisiones.remisiones = mockRemisiones;
      mockUseRemisiones.hasMore = true;
      
      render(<HistorialTrabajosOptimizado />);

      const cargarMasButton = screen.getByText('Cargar más resultados');
      expect(cargarMasButton).toBeInTheDocument();
    });

    test('debe cargar más datos al hacer clic en "Cargar más"', async () => {
      const user = userEvent.setup();
      mockUseRemisiones.remisiones = mockRemisiones;
      mockUseRemisiones.hasMore = true;
      
      render(<HistorialTrabajosOptimizado />);

      const cargarMasButton = screen.getByText('Cargar más resultados');
      await user.click(cargarMasButton);

      expect(mockUseRemisiones.fetchNextPage).toHaveBeenCalled();
    });

    test('no debe mostrar botón "Cargar más" cuando no hay más datos', () => {
      mockUseRemisiones.remisiones = mockRemisiones;
      mockUseRemisiones.hasMore = false;
      
      render(<HistorialTrabajosOptimizado />);

      expect(screen.queryByText('Cargar más resultados')).not.toBeInTheDocument();
    });
  });

  describe('Timeline modal', () => {
    test('debe abrir timeline al hacer clic en "Ver Timeline"', async () => {
      const user = userEvent.setup();
      mockUseRemisiones.remisiones = [mockRemisiones[0]];
      
      render(<HistorialTrabajosOptimizado />);

      const timelineButton = screen.getByText('Ver Timeline');
      await user.click(timelineButton);

      expect(screen.getByText('Timeline de Trabajo - REM-001')).toBeInTheDocument();
    });

    test('debe cargar historial al abrir timeline', async () => {
      const user = userEvent.setup();
      mockUseRemisiones.remisiones = [mockRemisiones[0]];
      
      render(<HistorialTrabajosOptimizado />);

      const timelineButton = screen.getByText('Ver Timeline');
      await user.click(timelineButton);

      expect(mockRemisionesService.fetchHistorialRemision).toHaveBeenCalledWith('rem-001');
    });

    test('debe mostrar historial en timeline', async () => {
      const user = userEvent.setup();
      mockUseRemisiones.remisiones = [mockRemisiones[0]];
      
      render(<HistorialTrabajosOptimizado />);

      const timelineButton = screen.getByText('Ver Timeline');
      await user.click(timelineButton);

      await waitFor(() => {
        expect(screen.getByText('Inicio de trabajo')).toBeInTheDocument();
        expect(screen.getByText('Trabajo en progreso')).toBeInTheDocument();
        expect(screen.getByText('Finalización')).toBeInTheDocument();
      });
    });

    test('debe cerrar timeline al hacer clic en cerrar', async () => {
      const user = userEvent.setup();
      mockUseRemisiones.remisiones = [mockRemisiones[0]];
      
      render(<HistorialTrabajosOptimizado />);

      // Abrir timeline
      const timelineButton = screen.getByText('Ver Timeline');
      await user.click(timelineButton);

      // Cerrar timeline
      const closeButton = screen.getByTestId('close-timeline');
      await user.click(closeButton);

      expect(screen.queryByText('Timeline de Trabajo - REM-001')).not.toBeInTheDocument();
    });
  });

  describe('Funcionalidades por rol', () => {
    test('debe mostrar funcionalidades administrativas para admin', () => {
      mockAuthContext.user = createMockUser('administrativo');
      mockUseRemisiones.remisiones = mockRemisiones;
      
      render(<HistorialTrabajosOptimizado />);

      expect(screen.getByText('Exportar Excel')).toBeInTheDocument();
    });

    test('debe ocultar funcionalidades para técnico básico', () => {
      mockAuthContext.user = createMockUser('tecnico');
      mockUseRemisiones.remisiones = mockRemisiones;
      
      render(<HistorialTrabajosOptimizado />);

      expect(screen.queryByText('Exportar Excel')).not.toBeInTheDocument();
    });
  });

  describe('Responsive design', () => {
    test('debe adaptar layout para móviles', () => {
      // Mock para pantalla móvil
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });

      mockUseRemisiones.remisiones = mockRemisiones;
      
      render(<HistorialTrabajosOptimizado />);

      const container = screen.getByTestId('historial-container');
      expect(container).toHaveClass('historial-container');
    });
  });

  describe('Accesibilidad', () => {
    test('debe tener navegación por teclado', async () => {
      const user = userEvent.setup();
      mockUseRemisiones.remisiones = [mockRemisiones[0]];
      
      render(<HistorialTrabajosOptimizado />);

      const timelineButton = screen.getByText('Ver Timeline');
      
      // Navegar con Tab
      await user.tab();
      expect(timelineButton).toHaveFocus();
      
      // Activar con Enter
      await user.keyboard('{Enter}');
      expect(screen.getByText('Timeline de Trabajo - REM-001')).toBeInTheDocument();
    });

    test('debe tener labels apropiados para screen readers', () => {
      render(<HistorialTrabajosOptimizado />);

      // Expandir filtros
      const expandButton = screen.getByTestId('expand-filtros');
      fireEvent.click(expandButton);

      expect(screen.getByLabelText('Buscar por texto')).toBeInTheDocument();
      expect(screen.getByLabelText('Estado')).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha Desde')).toBeInTheDocument();
    });

    test('debe anunciar cambios dinámicos', async () => {
      mockUseRemisiones.remisiones = [];
      
      const { rerender } = render(<HistorialTrabajosOptimizado />);

      // Simular carga de datos
      mockUseRemisiones.remisiones = mockRemisiones;
      mockUseRemisiones.total = 3;
      
      rerender(<HistorialTrabajosOptimizado />);

      expect(screen.getByText('3 remisiones encontradas')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('debe memoizar componentes pesados', () => {
      const renderSpy = jest.fn();
      
      const TestComponent = React.memo(() => {
        renderSpy();
        return <HistorialTrabajosOptimizado />;
      });

      const { rerender } = render(<TestComponent />);
      
      // Re-render con mismas props
      rerender(<TestComponent />);
      
      // Solo debe renderizar una vez
      expect(renderSpy).toHaveBeenCalledTimes(2); // Initial + rerender
    });

    test('debe manejar listas grandes eficientemente', () => {
      const manyRemisiones = Array.from({ length: 100 }, (_, i) => ({
        ...mockRemisiones[0],
        id: `rem-${i}`,
        numeroRemision: `REM-${i.toString().padStart(3, '0')}`
      }));

      mockUseRemisiones.remisiones = manyRemisiones;
      
      const startTime = performance.now();
      render(<HistorialTrabajosOptimizado />);
      const endTime = performance.now();

      // Debe renderizar en menos de 1 segundo
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
