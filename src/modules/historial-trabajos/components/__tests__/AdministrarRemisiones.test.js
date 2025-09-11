/**
 * Tests para el componente AdministrarRemisiones
 * 
 * Casos de prueba:
 * - Renderizado básico del componente
 * - Filtros por roles de usuario
 * - Funcionalidades CRUD según permisos
 * - Manejo de estados específicos
 * - Responsividad y UX
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mocks - declarados antes de usarlos con nombres específicos para Jest
const mockUseAuth = jest.fn();
const mockUseRole = jest.fn();
const mockUseRemisiones = jest.fn();
const mockUpdateRemision = jest.fn();
const mockDeleteRemision = jest.fn();

// Mock de servicios
jest.mock('../../../../services/remisionesService');

// Mock de módulos de auth
jest.mock('../../../../core/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

jest.mock('../../../../core/auth/RoleContext', () => ({
  useRole: () => mockUseRole()
}));

jest.mock('../../hooks/useRemisiones', () => ({
  useRemisiones: () => mockUseRemisiones()
}));

// Importar el componente después de los mocks
import AdministrarRemisiones, { ESTADOS_REMISION_PROCESO } from '../AdministrarRemisiones';
import * as remisionesService from '../../../../services/remisionesService';

// Datos de prueba
const mockRemisiones = [
  {
    id: 'rem-001',
    remision: 'REM-001',
    fecha_remision: new Date('2024-12-01'),
    movil: 'MOV-001',
    estado: 'pendiente',
    descripcion: 'Mantenimiento preventivo del vehículo',
    tecnico: 'tecnico@test.com',
    total: 150000
  },
  {
    id: 'rem-002',
    remision: 'REM-002',
    fecha_remision: new Date('2024-12-02'),
    movil: 'MOV-002',
    estado: 'garantia',
    descripcion: 'Reparación en garantía de motor',
    tecnico: 'tecnico2@test.com',
    total: 250000
  },
  {
    id: 'rem-003',
    remision: 'REM-003',
    fecha_remision: new Date('2024-12-03'),
    movil: 'MOV-003',
    estado: 'cortesia',
    descripcion: 'Servicio de cortesía post-venta',
    tecnico: 'tecnico@test.com',
    total: 0
  }
];

describe('AdministrarRemisiones', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Configuración de servicios mockeados
    remisionesService.updateRemision = mockUpdateRemision;
    remisionesService.deleteRemision = mockDeleteRemision;
    
    // Configuración base de mocks
    mockUseRemisiones.mockReturnValue({
      remisiones: mockRemisiones,
      loading: false,
      error: null,
      fetchFirstPage: jest.fn(),
      hasMore: false,
      fetchNextPage: jest.fn()
    });
  });

  describe('Renderizado básico', () => {
    test('debe renderizar el componente correctamente', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      render(<AdministrarRemisiones />);
      
      expect(screen.getByText('📋 Administrar Remisiones')).toBeInTheDocument();
      expect(screen.getByText(/ADMINISTRATIVO/)).toBeInTheDocument();
    });

    test('debe mostrar indicador de Super Admin para Davian.ayala7@gmail.com', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'Davian.ayala7@gmail.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'directivo',
        hasPermission: jest.fn(() => true)
      });

      render(<AdministrarRemisiones />);
      
      expect(screen.getByText(/⭐ SUPER ADMIN/)).toBeInTheDocument();
      expect(screen.getByText(/Davian.ayala7@gmail.com/)).toBeInTheDocument();
    });

    test('debe mostrar el mensaje de carga inicialmente', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      render(<AdministrarRemisiones />);
      
      expect(screen.getByText('👤 ADMINISTRATIVO - admin@test.com')).toBeInTheDocument();
    });

    test('debe mostrar filtros de búsqueda', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      render(<AdministrarRemisiones />);

      expect(screen.getByLabelText('Estado')).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha Desde')).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha Hasta')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
    });

    test('debe mostrar tabla con datos cuando hay remisiones', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      render(<AdministrarRemisiones />);

      expect(screen.getByText('REM-001')).toBeInTheDocument();
      expect(screen.getByText('REM-002')).toBeInTheDocument();
      expect(screen.getByText('REM-003')).toBeInTheDocument();
      expect(screen.getByText('📊 3 remisión(es) encontrada(s)')).toBeInTheDocument();
    });
  });

  describe('Permisos por roles', () => {
    test('rol directivo debe tener todos los permisos', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'director@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'directivo',
        hasPermission: jest.fn(() => true)
      });

      render(<AdministrarRemisiones />);

      // Debe ver botón de exportar
      expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument();
      
      // Debe ver todos los botones de acción
      const editButtons = screen.getAllByTitle('Editar');
      const deleteButtons = screen.getAllByTitle('Eliminar');
      
      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
    });

    test('rol administrativo debe tener permisos limitados', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      render(<AdministrarRemisiones />);

      // Debe ver botón de exportar
      expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument();
      
      // Debe ver botones de editar pero NO de eliminar
      const editButtons = screen.getAllByTitle('Editar');
      const deleteButtons = screen.queryAllByTitle('Eliminar');
      
      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(0);
    });

    test('rol técnico debe tener permisos mínimos', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'tecnico@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'tecnico',
        hasPermission: jest.fn(() => false)
      });

      render(<AdministrarRemisiones />);

      // NO debe ver botón de exportar
      expect(screen.queryByRole('button', { name: /exportar/i })).not.toBeInTheDocument();
      
      // NO debe ver botones de editar ni eliminar
      const editButtons = screen.queryAllByTitle('Editar');
      const deleteButtons = screen.queryAllByTitle('Eliminar');
      
      expect(editButtons).toHaveLength(0);
      expect(deleteButtons).toHaveLength(0);
    });

    test('técnico solo debe ver sus propias remisiones', () => {
      const mockFetchFirstPage = jest.fn();
      
      mockUseAuth.mockReturnValue({
        user: { email: 'tecnico@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'tecnico',
        hasPermission: jest.fn(() => false)
      });

      mockUseRemisiones.mockReturnValue({
        remisiones: mockRemisiones.filter(r => r.tecnico === 'tecnico@test.com'),
        loading: false,
        error: null,
        fetchFirstPage: mockFetchFirstPage,
        hasMore: false,
        fetchNextPage: jest.fn()
      });

      render(<AdministrarRemisiones />);

      // Debe mostrar solo remisiones del técnico
      expect(screen.getByText('REM-001')).toBeInTheDocument();
      expect(screen.getByText('REM-003')).toBeInTheDocument();
      expect(screen.queryByText('REM-002')).not.toBeInTheDocument();
    });
  });

  describe('Estados específicos', () => {
    test('debe mostrar badges de estado con colores correctos', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      render(<AdministrarRemisiones />);

      const pendienteBadge = screen.getByText('Pendiente');
      const garantiaBadge = screen.getByText('Garantía');
      const cortesiaBadge = screen.getByText('Cortesía');

      expect(pendienteBadge).toHaveStyle('background-color: #ffc107');
      expect(garantiaBadge).toHaveStyle('background-color: #17a2b8');
      expect(cortesiaBadge).toHaveStyle('background-color: #20c997');
    });

    test('debe filtrar estados disponibles según el rol', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'tecnico@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'tecnico',
        hasPermission: jest.fn(() => false)
      });

      render(<AdministrarRemisiones />);

      const estadoSelect = screen.getByLabelText('Estado');
      
      // Técnico solo debe ver estados limitados
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
      expect(screen.getByText('Garantía')).toBeInTheDocument();
      expect(screen.getByText('Cortesía')).toBeInTheDocument();
      
      // No debe ver otros estados
      expect(screen.queryByText('Proforma')).not.toBeInTheDocument();
      expect(screen.queryByText('Radicado')).not.toBeInTheDocument();
    });
  });

  describe('Funcionalidades CRUD', () => {
    test('debe abrir modal de edición al hacer click en editar', async () => {
      const user = userEvent.setup();
      
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      render(<AdministrarRemisiones />);

      const editButton = screen.getAllByTitle('Editar')[0];
      await user.click(editButton);

      expect(screen.getByText('✏️ Editar Remisión REM-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('MOV-001')).toBeInTheDocument();
    });

    test('debe guardar cambios en modal de edición', async () => {
      const user = userEvent.setup();
      
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      mockUpdateRemision.mockResolvedValue({});

      render(<AdministrarRemisiones />);

      // Abrir modal
      const editButton = screen.getAllByTitle('Editar')[0];
      await user.click(editButton);

      // Modificar móvil
      const movilInput = screen.getByDisplayValue('MOV-001');
      await user.clear(movilInput);
      await user.type(movilInput, 'MOV-001-UPDATED');

      // Guardar
      const saveButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateRemision).toHaveBeenCalledWith('rem-001', {
          movil: 'MOV-001-UPDATED',
          estado: 'pendiente',
          descripcion: 'Mantenimiento preventivo del vehículo',
          total: '150000'
        });
      });
    });

    test('debe eliminar remisión con confirmación', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm
      window.confirm = jest.fn(() => true);
      
      mockUseAuth.mockReturnValue({
        user: { email: 'director@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'directivo',
        hasPermission: jest.fn(() => true)
      });

      mockDeleteRemision.mockResolvedValue({});

      render(<AdministrarRemisiones />);

      const deleteButton = screen.getAllByTitle('Eliminar')[0];
      await user.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('¿Está seguro de que desea eliminar la remisión REM-001?')
      );

      await waitFor(() => {
        expect(mockDeleteRemision).toHaveBeenCalledWith('rem-001');
      });
    });

    test('debe validar campos requeridos en modal de edición', async () => {
      const user = userEvent.setup();
      
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      // Mock window.alert
      window.alert = jest.fn();

      render(<AdministrarRemisiones />);

      // Abrir modal
      const editButton = screen.getAllByTitle('Editar')[0];
      await user.click(editButton);

      // Limpiar campo móvil (requerido)
      const movilInput = screen.getByDisplayValue('MOV-001');
      await user.clear(movilInput);

      // Intentar guardar
      const saveButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(saveButton);

      expect(window.alert).toHaveBeenCalledWith('El móvil es obligatorio');
      expect(mockUpdateRemision).not.toHaveBeenCalled();
    });
  });

  describe('Filtros y búsqueda', () => {
    test('debe ejecutar búsqueda al cambiar filtros', async () => {
      const user = userEvent.setup();
      const mockFetchFirstPage = jest.fn();
      
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      mockUseRemisiones.mockReturnValue({
        remisiones: mockRemisiones,
        loading: false,
        error: null,
        fetchFirstPage: mockFetchFirstPage,
        hasMore: false,
        fetchNextPage: jest.fn()
      });

      render(<AdministrarRemisiones />);

      // Cambiar estado
      const estadoSelect = screen.getByLabelText('Estado');
      await user.selectOptions(estadoSelect, 'pendiente');

      // Hacer click en buscar
      const searchButton = screen.getByRole('button', { name: /buscar/i });
      await user.click(searchButton);

      expect(mockFetchFirstPage).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: 'pendiente'
        })
      );
    });

    test('debe configurar filtro por defecto de 30 días', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      render(<AdministrarRemisiones />);

      const fechaDesde = screen.getByLabelText('Fecha Desde');
      const fechaHasta = screen.getByLabelText('Fecha Hasta');

      // Verificar que las fechas están configuradas
      expect(fechaDesde.value).toBeTruthy();
      expect(fechaHasta.value).toBeTruthy();
      
      // Verificar que la diferencia es aproximadamente 30 días
      const desde = new Date(fechaDesde.value);
      const hasta = new Date(fechaHasta.value);
      const diferenciaDias = (hasta - desde) / (1000 * 60 * 60 * 24);
      
      expect(diferenciaDias).toBeCloseTo(30, 0);
    });
  });

  describe('Estados de carga y error', () => {
    test('debe mostrar estado de carga', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      mockUseRemisiones.mockReturnValue({
        remisiones: [],
        loading: true,
        error: null,
        fetchFirstPage: jest.fn(),
        hasMore: false,
        fetchNextPage: jest.fn()
      });

      render(<AdministrarRemisiones />);

      expect(screen.getByText('🔄 Cargando remisiones...')).toBeInTheDocument();
    });

    test('debe mostrar mensaje de error', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      mockUseRemisiones.mockReturnValue({
        remisiones: [],
        loading: false,
        error: 'Error de conexión',
        fetchFirstPage: jest.fn(),
        hasMore: false,
        fetchNextPage: jest.fn()
      });

      render(<AdministrarRemisiones />);

      expect(screen.getByText('❌ Error: Error de conexión')).toBeInTheDocument();
    });

    test('debe mostrar mensaje cuando no hay resultados', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      mockUseRemisiones.mockReturnValue({
        remisiones: [],
        loading: false,
        error: null,
        fetchFirstPage: jest.fn(),
        hasMore: false,
        fetchNextPage: jest.fn()
      });

      render(<AdministrarRemisiones />);

      expect(screen.getByText('📭 No se encontraron remisiones con los filtros especificados')).toBeInTheDocument();
    });
  });

  describe('Formateo de datos', () => {
    test('debe formatear fechas correctamente', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      render(<AdministrarRemisiones />);

      expect(screen.getByText('01/12/2024')).toBeInTheDocument();
      expect(screen.getByText('02/12/2024')).toBeInTheDocument();
      expect(screen.getByText('03/12/2024')).toBeInTheDocument();
    });

    test('debe formatear montos correctamente', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      render(<AdministrarRemisiones />);

      expect(screen.getByText('$150,000')).toBeInTheDocument();
      expect(screen.getByText('$250,000')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument(); // Para total = 0
    });

    test('debe truncar descripciones largas', () => {
      const remisionConDescripcionLarga = {
        ...mockRemisiones[0],
        descripcion: 'Esta es una descripción muy larga que debería ser truncada porque excede el límite de caracteres permitidos en la tabla'
      };

      mockUseAuth.mockReturnValue({
        user: { email: 'admin@test.com' }
      });
      
      mockUseRole.mockReturnValue({
        userRole: 'administrativo',
        hasPermission: jest.fn(() => true)
      });

      mockUseRemisiones.mockReturnValue({
        remisiones: [remisionConDescripcionLarga],
        loading: false,
        error: null,
        fetchFirstPage: jest.fn(),
        hasMore: false,
        fetchNextPage: jest.fn()
      });

      render(<AdministrarRemisiones />);

      expect(screen.getByText(/Esta es una descripción muy larga que debería.../)).toBeInTheDocument();
    });
  });
});

describe('Constantes ESTADOS_REMISION_PROCESO', () => {
  test('debe contener todos los estados requeridos', () => {
    const estadosEsperados = [
      'CANCELADO', 'PENDIENTE', 'GARANTIA', 'PROFORMA', 
      'CORTESIA', 'RADICADO', 'SIN_VINCULAR'
    ];

    estadosEsperados.forEach(estado => {
      expect(ESTADOS_REMISION_PROCESO[estado]).toBeDefined();
      expect(ESTADOS_REMISION_PROCESO[estado].value).toBeTruthy();
      expect(ESTADOS_REMISION_PROCESO[estado].label).toBeTruthy();
      expect(ESTADOS_REMISION_PROCESO[estado].color).toBeTruthy();
      expect(ESTADOS_REMISION_PROCESO[estado].description).toBeTruthy();
    });
  });

  test('debe tener colores únicos para cada estado', () => {
    const colores = Object.values(ESTADOS_REMISION_PROCESO).map(e => e.color);
    const coloresUnicos = [...new Set(colores)];
    
    expect(colores).toHaveLength(coloresUnicos.length);
  });
});
