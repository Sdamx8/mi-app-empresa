/**
 * Tests E2E para funcionalidades principales del módulo Historial de Trabajos
 * 
 * Casos de prueba:
 * - Navegación inicial
 * - Aplicación de filtros
 * - Visualización de datos
 * - Timeline de trabajos
 * - Paginación
 * - Exportación de datos
 */

describe('Historial de Trabajos - Funcionalidades Principales', () => {
  beforeEach(() => {
    // Configurar usuario administrativo
    cy.loginAs('administrativo');
    
    // Mock de datos de prueba
    cy.mockRemisionesData();
    
    // Visitar el módulo
    cy.visitHistorialTrabajos();
  });

  describe('Navegación y Estado Inicial', () => {
    it('debe mostrar la interfaz principal correctamente', () => {
      // Verificar header del módulo
      cy.get('[data-cy="module-header"]').should('be.visible');
      cy.get('[data-cy="module-title"]').should('contain', 'Historial de Trabajos');
      cy.get('[data-cy="module-description"]').should('contain', 'Consulta y gestión del historial');
      
      // Verificar información de usuario
      cy.get('[data-cy="user-info"]').should('be.visible');
      cy.get('[data-cy="user-role"]').should('contain', 'ADMINISTRATIVO');
      
      // Verificar sección de filtros
      cy.get('[data-cy="filtros-container"]').should('be.visible');
      cy.get('[data-cy="filtros-header"]').should('contain', 'Filtros de Búsqueda');
    });

    it('debe mostrar estado inicial cuando no hay filtros aplicados', () => {
      // Verificar estado inicial
      cy.get('[data-cy="initial-state"]').should('be.visible');
      cy.get('[data-cy="initial-state-title"]').should('contain', 'Comenzar Búsqueda');
      cy.get('[data-cy="initial-state-description"]').should('contain', 'Utiliza los filtros');
    });

    it('debe tener navegación por teclado funcional', () => {
      // Verificar que se puede navegar con Tab
      cy.get('body').tab();
      cy.focused().should('be.visible');
      
      // Verificar accesibilidad básica
      cy.checkAccessibility();
    });
  });

  describe('Sistema de Filtros', () => {
    it('debe expandir y contraer filtros correctamente', () => {
      const perf = cy.measurePerformance('expand-filters');
      
      // Verificar estado inicial (colapsado)
      cy.get('[data-cy="filtros-form"]').should('not.be.visible');
      
      // Expandir filtros
      cy.get('[data-cy="expand-filtros"]').click();
      cy.get('[data-cy="filtros-form"]').should('be.visible');
      
      // Verificar todos los campos de filtro
      cy.get('[data-cy="filtros-texto"]').should('be.visible');
      cy.get('[data-cy="filtros-estado"]').should('be.visible');
      cy.get('[data-cy="filtros-fecha-desde"]').should('be.visible');
      cy.get('[data-cy="filtros-fecha-hasta"]').should('be.visible');
      cy.get('[data-cy="filtros-tecnico"]').should('be.visible');
      cy.get('[data-cy="filtros-cliente"]').should('be.visible');
      
      // Contraer filtros
      cy.get('[data-cy="expand-filtros"]').click();
      cy.get('[data-cy="filtros-form"]').should('not.be.visible');
      
      perf.end();
    });

    it('debe aplicar filtros de texto correctamente', () => {
      // Aplicar filtro de texto
      cy.applyFilters({ texto: 'Cliente Test' });
      
      // Verificar que se ejecutó la búsqueda
      cy.get('[data-cy="results-section"]').should('be.visible');
      
      // Verificar filtros aplicados
      cy.get('[data-cy="filtros-aplicados"]').should('be.visible');
      cy.get('[data-cy="filtro-tag"]').should('contain', 'Cliente Test');
    });

    it('debe aplicar filtros por estado', () => {
      cy.applyFilters({ estado: 'completado' });
      
      // Verificar filtro aplicado
      cy.get('[data-cy="filtro-tag"]').should('contain', 'completado');
      
      // Verificar que solo aparecen remisiones completadas (si hay datos)
      cy.get('[data-cy="remision-card"]').each(($card) => {
        cy.wrap($card).find('[data-cy="card-estado"]').should('contain', 'COMPLETADO');
      });
    });

    it('debe aplicar filtros por rango de fechas', () => {
      cy.applyFilters({
        fechaDesde: '2024-12-01',
        fechaHasta: '2024-12-31'
      });
      
      // Verificar filtros aplicados
      cy.get('[data-cy="filtro-tag"]').should('contain', '2024-12-01');
      cy.get('[data-cy="filtro-tag"]').should('contain', '2024-12-31');
    });

    it('debe combinar múltiples filtros', () => {
      cy.applyFilters({
        texto: 'Cliente',
        estado: 'proceso',
        fechaDesde: '2024-12-01'
      });
      
      // Verificar que todos los filtros se aplicaron
      cy.get('[data-cy="filtro-tag"]').should('have.length.at.least', 3);
    });

    it('debe limpiar filtros correctamente', () => {
      // Aplicar filtros primero
      cy.applyFilters({ texto: 'test', estado: 'completado' });
      
      // Verificar que hay filtros aplicados
      cy.get('[data-cy="filtro-tag"]').should('have.length.at.least', 1);
      
      // Limpiar filtros
      cy.clearFilters();
      
      // Verificar que no hay filtros aplicados
      cy.get('[data-cy="filtro-tag"]').should('not.exist');
      
      // Verificar que volvió al estado inicial
      cy.get('[data-cy="initial-state"]').should('be.visible');
    });
  });

  describe('Visualización de Datos', () => {
    beforeEach(() => {
      // Aplicar un filtro para mostrar datos
      cy.applyFilters({ texto: 'test' });
    });

    it('debe mostrar información de resultados', () => {
      cy.get('[data-cy="results-info"]').should('be.visible');
      cy.get('[data-cy="results-count"]').should('contain', 'remisiones encontradas');
      cy.get('[data-cy="results-description"]').should('be.visible');
    });

    it('debe mostrar las tarjetas de remisión correctamente', () => {
      cy.get('[data-cy="remision-card"]').should('have.length.at.least', 1);
      
      // Verificar primera tarjeta
      cy.get('[data-cy="remision-card"]').first().within(() => {
        cy.get('[data-cy="card-numero"]').should('be.visible');
        cy.get('[data-cy="card-cliente"]').should('be.visible');
        cy.get('[data-cy="card-estado"]').should('be.visible');
        cy.get('[data-cy="card-fecha"]').should('be.visible');
        cy.get('[data-cy="card-movil"]').should('be.visible');
        cy.get('[data-cy="card-acciones"]').should('be.visible');
      });
    });

    it('debe mostrar estados con colores correctos', () => {
      cy.get('[data-cy="card-estado"]').each(($estado) => {
        const estadoText = $estado.text().toLowerCase();
        
        if (estadoText.includes('completado')) {
          cy.wrap($estado).should('have.class', 'estado-completado');
        } else if (estadoText.includes('proceso')) {
          cy.wrap($estado).should('have.class', 'estado-proceso');
        } else if (estadoText.includes('pendiente')) {
          cy.wrap($estado).should('have.class', 'estado-pendiente');
        }
      });
    });

    it('debe formatear montos correctamente', () => {
      cy.get('[data-cy="card-total"]').each(($total) => {
        // Verificar que tiene formato de moneda colombiana
        cy.wrap($total).should('match', /\$[\d,]+/);
      });
    });
  });

  describe('Timeline de Trabajos', () => {
    beforeEach(() => {
      cy.applyFilters({ texto: 'test' });
    });

    it('debe abrir el timeline al hacer clic en "Ver Timeline"', () => {
      const perf = cy.measurePerformance('open-timeline');
      
      // Abrir timeline de la primera remisión
      cy.get('[data-cy="remision-card"]').first().within(() => {
        cy.get('[data-cy^="timeline-btn-"]').click();
      });
      
      // Verificar que se abrió el modal
      cy.get('[data-cy="timeline-modal"]').should('be.visible');
      cy.get('[data-cy="timeline-header"]').should('be.visible');
      cy.get('[data-cy="timeline-title"]').should('contain', 'Timeline de Trabajo');
      
      perf.end();
    });

    it('debe mostrar el historial de actividades', () => {
      // Abrir timeline
      cy.get('[data-cy="remision-card"]').first().within(() => {
        cy.get('[data-cy^="timeline-btn-"]').click();
      });
      
      // Esperar a que cargue el historial
      cy.get('[data-cy="timeline-loading"]').should('not.exist');
      
      // Verificar items del timeline
      cy.get('[data-cy="timeline-item"]').should('have.length.at.least', 1);
      
      cy.get('[data-cy="timeline-item"]').first().within(() => {
        cy.get('[data-cy="timeline-fecha"]').should('be.visible');
        cy.get('[data-cy="timeline-tecnico"]').should('be.visible');
        cy.get('[data-cy="timeline-actividad"]').should('be.visible');
        cy.get('[data-cy="timeline-descripcion"]').should('be.visible');
      });
    });

    it('debe cerrar el timeline correctamente', () => {
      // Abrir timeline
      cy.get('[data-cy="remision-card"]').first().within(() => {
        cy.get('[data-cy^="timeline-btn-"]').click();
      });
      
      // Cerrar timeline
      cy.closeTimeline();
      
      // Verificar que se cerró
      cy.get('[data-cy="timeline-modal"]').should('not.exist');
    });

    it('debe cerrar timeline con tecla Escape', () => {
      // Abrir timeline
      cy.get('[data-cy="remision-card"]').first().within(() => {
        cy.get('[data-cy^="timeline-btn-"]').click();
      });
      
      // Presionar Escape
      cy.get('body').type('{esc}');
      
      // Verificar que se cerró
      cy.get('[data-cy="timeline-modal"]').should('not.exist');
    });
  });

  describe('Paginación', () => {
    it('debe cargar más resultados al hacer clic en "Cargar más"', () => {
      // Aplicar filtros para mostrar resultados
      cy.applyFilters({ texto: 'test' });
      
      // Verificar que hay resultados
      cy.get('[data-cy="remision-card"]').should('have.length.at.least', 1);
      
      // Si hay botón de cargar más, hacer clic
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="btn-cargar-mas"]').length > 0) {
          const initialCount = Cypress.$('[data-cy="remision-card"]').length;
          
          cy.loadMoreResults();
          
          // Verificar que se cargaron más resultados
          cy.get('[data-cy="remision-card"]').should('have.length.greaterThan', initialCount);
        }
      });
    });

    it('debe ocultar botón "Cargar más" cuando no hay más datos', () => {
      cy.applyFilters({ texto: 'test' });
      
      // Si no hay más datos, no debe mostrar el botón
      cy.get('[data-cy="btn-cargar-mas"]').should('not.exist');
    });
  });

  describe('Exportación de Datos', () => {
    beforeEach(() => {
      cy.applyFilters({ texto: 'test' });
    });

    it('debe mostrar opciones de exportación para usuarios autorizados', () => {
      cy.get('[data-cy="results-actions"]').within(() => {
        cy.get('[data-cy="btn-export-excel"]').should('be.visible');
      });
    });

    it('debe exportar datos a Excel', () => {
      cy.exportData('excel');
      
      // Verificar que se ejecutó la exportación
      cy.get('@exportData').should('have.been.called');
      
      // Verificar mensaje de éxito o descarga
      cy.get('[data-cy="export-success"]').should('be.visible');
    });

    it('no debe mostrar exportación para usuarios técnicos', () => {
      // Cambiar a usuario técnico
      cy.loginAs('tecnico');
      cy.visitHistorialTrabajos();
      cy.applyFilters({ texto: 'test' });
      
      // No debe mostrar botones de exportación
      cy.get('[data-cy="btn-export-excel"]').should('not.exist');
    });
  });

  describe('Estados de Error', () => {
    it('debe manejar errores de red correctamente', () => {
      // Simular error de red
      cy.intercept('POST', '**/firestore.googleapis.com/**', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('networkError');
      
      cy.applyFilters({ texto: 'test' });
      
      // Verificar mensaje de error
      cy.get('[data-cy="error-container"]').should('be.visible');
      cy.get('[data-cy="error-message"]').should('contain', 'Error al cargar datos');
    });

    it('debe mostrar mensaje cuando no hay resultados', () => {
      // Simular respuesta sin datos
      cy.intercept('POST', '**/firestore.googleapis.com/**', {
        statusCode: 200,
        body: { documents: [] }
      }).as('noResults');
      
      cy.applyFilters({ texto: 'xyz123noexiste' });
      
      // Verificar mensaje de sin resultados
      cy.get('[data-cy="no-results"]').should('be.visible');
      cy.get('[data-cy="no-results-message"]').should('contain', 'No se encontraron remisiones');
    });
  });

  describe('Performance y UX', () => {
    it('debe cargar la página en tiempo razonable', () => {
      const perf = cy.measurePerformance('page-load');
      
      cy.visitHistorialTrabajos();
      
      // Verificar que la interfaz está lista
      cy.get('[data-cy="module-header"]').should('be.visible');
      cy.get('[data-cy="filtros-container"]').should('be.visible');
      
      perf.end();
    });

    it('debe mostrar skeleton loading durante carga', () => {
      // Simular carga lenta
      cy.intercept('POST', '**/firestore.googleapis.com/**', (req) => {
        req.reply({
          delay: 1000,
          statusCode: 200,
          body: { documents: [] }
        });
      }).as('slowQuery');
      
      cy.applyFilters({ texto: 'test' });
      
      // Verificar skeleton loading
      cy.get('[data-cy="skeleton-loading"]').should('be.visible');
      
      // Esperar a que termine la carga
      cy.wait('@slowQuery');
      cy.get('[data-cy="skeleton-loading"]').should('not.exist');
    });

    it('debe ser responsive en diferentes tamaños de pantalla', () => {
      cy.applyFilters({ texto: 'test' });
      
      // Test de responsive
      cy.testResponsive();
    });
  });
});
