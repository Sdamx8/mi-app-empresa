/**
 * Tests para utilidades y helpers del módulo historial-trabajos
 */

// Utilidades de formateo que podrían estar en el módulo
const formatUtils = {
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  },

  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO');
  },

  formatEstado: (estado) => {
    const estados = {
      'pendiente': { texto: 'PENDIENTE', color: 'warning' },
      'proceso': { texto: 'EN PROCESO', color: 'info' },
      'completado': { texto: 'COMPLETADO', color: 'success' },
      'cancelado': { texto: 'CANCELADO', color: 'error' }
    };
    return estados[estado] || { texto: estado.toUpperCase(), color: 'default' };
  },

  generateRemisionNumber: (prefix = 'REM', number) => {
    return `${prefix}-${number.toString().padStart(3, '0')}`;
  },

  validateRemisionData: (data) => {
    const errors = [];
    
    if (!data.numeroRemision) errors.push('Número de remisión es requerido');
    if (!data.fecha) errors.push('Fecha es requerida');
    if (!data.cliente) errors.push('Cliente es requerido');
    if (!data.movil) errors.push('Móvil es requerido');
    if (!data.servicios || data.servicios.length === 0) errors.push('Al menos un servicio es requerido');
    if (!data.tecnicos || data.tecnicos.length === 0) errors.push('Al menos un técnico es requerido');
    if (typeof data.total !== 'number' || data.total <= 0) errors.push('Total debe ser un número mayor a 0');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  calculateTotals: (remisiones) => {
    return remisiones.reduce((acc, remision) => {
      acc.total += remision.total || 0;
      acc.count += 1;
      
      if (remision.estado === 'completado') {
        acc.completados += 1;
        acc.montoCompletado += remision.total || 0;
      }
      
      return acc;
    }, {
      total: 0,
      count: 0,
      completados: 0,
      montoCompletado: 0,
      promedio: 0
    });
  }
};

describe('Utilidades del Módulo Historial Trabajos', () => {
  describe('formatUtils.formatCurrency', () => {
    test('debe formatear números como moneda colombiana', () => {
      expect(formatUtils.formatCurrency(250000)).toMatch(/250.000/);
      expect(formatUtils.formatCurrency(1500000)).toMatch(/1.500.000/);
      expect(formatUtils.formatCurrency(0)).toMatch(/0/);
    });

    test('debe manejar números decimales', () => {
      const result = formatUtils.formatCurrency(250000.50);
      expect(result).toMatch(/250.000/);
    });
  });

  describe('formatUtils.formatDate', () => {
    test('debe formatear fechas correctamente', () => {
      const result = formatUtils.formatDate('2024-12-01');
      expect(result).toMatch(/1\/12\/2024|1-12-2024/);
    });

    test('debe manejar diferentes formatos de fecha', () => {
      expect(() => formatUtils.formatDate('2024-12-01')).not.toThrow();
      expect(() => formatUtils.formatDate('2024/12/01')).not.toThrow();
    });
  });

  describe('formatUtils.formatEstado', () => {
    test('debe formatear estados conocidos correctamente', () => {
      expect(formatUtils.formatEstado('pendiente')).toEqual({
        texto: 'PENDIENTE',
        color: 'warning'
      });

      expect(formatUtils.formatEstado('completado')).toEqual({
        texto: 'COMPLETADO',
        color: 'success'
      });

      expect(formatUtils.formatEstado('proceso')).toEqual({
        texto: 'EN PROCESO',
        color: 'info'
      });
    });

    test('debe manejar estados desconocidos', () => {
      const result = formatUtils.formatEstado('estado_nuevo');
      expect(result.texto).toBe('ESTADO_NUEVO');
      expect(result.color).toBe('default');
    });
  });

  describe('formatUtils.generateRemisionNumber', () => {
    test('debe generar números de remisión con formato correcto', () => {
      expect(formatUtils.generateRemisionNumber('REM', 1)).toBe('REM-001');
      expect(formatUtils.generateRemisionNumber('REM', 25)).toBe('REM-025');
      expect(formatUtils.generateRemisionNumber('REM', 150)).toBe('REM-150');
    });

    test('debe usar prefijo por defecto', () => {
      expect(formatUtils.generateRemisionNumber(undefined, 5)).toBe('REM-005');
    });
  });

  describe('formatUtils.validateRemisionData', () => {
    const remisionValida = {
      numeroRemision: 'REM-001',
      fecha: '2024-12-01',
      cliente: 'Cliente Test',
      movil: 'MOV-001',
      servicios: ['Servicio 1'],
      tecnicos: ['Juan Pérez'],
      total: 250000
    };

    test('debe validar remisión válida', () => {
      const result = formatUtils.validateRemisionData(remisionValida);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('debe detectar campos faltantes', () => {
      const remisionInvalida = { ...remisionValida };
      delete remisionInvalida.numeroRemision;
      delete remisionInvalida.cliente;

      const result = formatUtils.validateRemisionData(remisionInvalida);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Número de remisión es requerido');
      expect(result.errors).toContain('Cliente es requerido');
    });

    test('debe validar arrays vacíos', () => {
      const remisionInvalida = {
        ...remisionValida,
        servicios: [],
        tecnicos: []
      };

      const result = formatUtils.validateRemisionData(remisionInvalida);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Al menos un servicio es requerido');
      expect(result.errors).toContain('Al menos un técnico es requerido');
    });

    test('debe validar total numérico', () => {
      const remisionInvalida = {
        ...remisionValida,
        total: 'no es un número'
      };

      const result = formatUtils.validateRemisionData(remisionInvalida);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total debe ser un número mayor a 0');
    });
  });

  describe('formatUtils.calculateTotals', () => {
    const remisionesPrueba = [
      { total: 250000, estado: 'completado' },
      { total: 150000, estado: 'proceso' },
      { total: 300000, estado: 'completado' },
      { total: 100000, estado: 'pendiente' }
    ];

    test('debe calcular totales correctamente', () => {
      const result = formatUtils.calculateTotals(remisionesPrueba);
      
      expect(result.total).toBe(800000);
      expect(result.count).toBe(4);
      expect(result.completados).toBe(2);
      expect(result.montoCompletado).toBe(550000);
    });

    test('debe manejar array vacío', () => {
      const result = formatUtils.calculateTotals([]);
      
      expect(result.total).toBe(0);
      expect(result.count).toBe(0);
      expect(result.completados).toBe(0);
      expect(result.montoCompletado).toBe(0);
    });

    test('debe manejar datos con valores faltantes', () => {
      const remisionesIncompletas = [
        { estado: 'completado' }, // sin total
        { total: 100000 }, // sin estado
        { total: 200000, estado: 'completado' }
      ];

      const result = formatUtils.calculateTotals(remisionesIncompletas);
      
      expect(result.total).toBe(300000);
      expect(result.count).toBe(3);
      expect(result.completados).toBe(2);
      expect(result.montoCompletado).toBe(200000);
    });
  });
});
