/**
 * Tests unitarios para HistorialTrabajosOptimizado component
 * 
 * Casos de prueba básicos:
 * - Renderizado inicial
 * - Filtros y búsqueda
 * - Visualización de datos
 * - Interacciones de usuario
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistorialTrabajosOptimizado from '../HistorialTrabajosOptimizado';

// Mock del hook useRemisiones
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
  updateRemision: jest.fn(),
  isLoadingFirstPage: false,
  isLoadingNextPage: false
};

jest.mock('../../hooks/useRemisiones', () => ({
  useRemisiones: jest.fn(() => mockUseRemisiones),
  useHistorialRemision: jest.fn(() => ({
    historial: [],
    loading: false,
    error: null,
    fetchHistorial: jest.fn()
  }))
}));

// Mock del servicio para historial
const mockFetchHistorialRemision = jest.fn();
jest.mock('../../../../services/remisionesService', () => ({
  fetchHistorialRemision: mockFetchHistorialRemision,
  fetchRemisiones: jest.fn(),
  fetchAllRemisionesForExport: jest.fn(),
}));

// Mock del contexto de auth
const mockUser = {
  uid: 'admin-test-id',
  email: 'admin@test.com',
  customClaims: { role: 'administrativo' }
};

jest.mock('../../../../core/auth/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false
  })
}));

// Mock del hook useEmpleadoAuth
jest.mock('../../hooks/useEmpleadoAuth', () => ({
  useEmpleadoAuth: () => ({
    empleado: {
      role: 'administrativo',
      permisos: ['ver_historial', 'exportar_datos']
    },
    loading: false,
    error: null
  })
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

const mockHistorial = [
  {
    id: 'hist-001',
    fecha: '2024-12-01T10:00:00Z',
    tecnico: 'Juan Pérez',
    actividad: 'Inicio de trabajo',
    descripcion: 'Se inició el trabajo de mantenimiento',
    materiales: ['Material 1', 'Material 2'],
    tiempoInvertido: 120
  }
];

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

    mockFetchHistorialRemision.mockResolvedValue(mockHistorial);
  });

  describe('Renderizado inicial', () => {
    test('debe renderizar el header correctamente', () => {
      render(<HistorialTrabajosOptimizado />);

      expect(screen.getByText('Historial de Trabajos')).toBeInTheDocument();
      expect(screen.getByText('Consulta y gestión del historial de remisiones')).toBeInTheDocument();
      expect(screen.getByText('ADMINISTRATIVO')).toBeInTheDocument();
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

      expect(screen.getByText('2 remisiones encontradas')).toBeInTheDocument();
      expect(screen.getByText('REM-001')).toBeInTheDocument();
      expect(screen.getByText('REM-002')).toBeInTheDocument();
    });

    test('debe mostrar información detallada de cada remisión', () => {
      mockUseRemisiones.remisiones = [mockRemisiones[0]];
      
      render(<HistorialTrabajosOptimizado />);

      expect(screen.getByText('Cliente Test 1')).toBeInTheDocument();
      expect(screen.getByText('MOV-001')).toBeInTheDocument();
      expect(screen.getByText('$250,000')).toBeInTheDocument();
      expect(screen.getByText('Juan Pérez, María García')).toBeInTheDocument();
    });
  });

  describe('Funcionalidades por rol', () => {
    test('debe mostrar funcionalidades administrativas para admin', () => {
      mockUseRemisiones.remisiones = mockRemisiones;
      
      render(<HistorialTrabajosOptimizado />);

      expect(screen.getByText('Exportar Excel')).toBeInTheDocument();
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
  });
});
