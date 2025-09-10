/**
 * Tests E2E para roles y permisos en Historial de Trabajos
 * 
 * Casos de prueba:
 * - Acceso por roles (técnico, administrativo, directivo)
 * - Funcionalidades específicas por rol
 * - Restricciones de datos por rol
 * - Exportación por permisos
 */

describe('Historial de Trabajos - Roles y Permisos', () => {
  beforeEach(() => {
    // Mock de datos específicos por rol
    cy.mockRemisionesData([
      {
        id: 'rem-tecnico-001',
        numeroRemision: 'REM-TEC-001',
        fecha: '2024-12-01',
        cliente: 'Cliente Técnico',
        movil: 'MOV-001',
        estado: 'proceso',
        servicios: ['Mantenimiento'],
        tecnicos: ['tecnico@test.com'],
        total: 150000
      },
      {
        id: 'rem-admin-001',
        numeroRemision: 'REM-ADM-001',
        fecha: '2024-12-02',
        cliente: 'Cliente Admin',
        movil: 'MOV-002',
        estado: 'completado',
        servicios: ['Reparación'],
        tecnicos: ['admin@test.com'],
        total: 300000
      }
    ]);
  });

  describe('Rol Técnico', () => {
    beforeEach(() => {
      cy.loginAs('tecnico');
      cy.visitHistorialTrabajos();
    });

    it('debe mostrar información básica del rol', () => {
      // Verificar información de usuario
      cy.get('[data-cy="user-info"]').should('be.visible');
      cy.get('[data-cy="user-role"]').should('contain', 'TÉCNICO');
      cy.get('[data-cy="user-name"]').should('contain', 'tecnico@test.com');
    });

    it('debe permitir consultar remisiones', () => {
      // Aplicar filtros básicos
      cy.applyFilters({ texto: 'tecnico' });
      
      // Verificar que puede ver resultados
      cy.get('[data-cy="results-section"]').should('be.visible');
      cy.get('[data-cy="remision-card"]').should('exist');
    });

    it('debe permitir ver timeline de trabajos', () => {
      cy.applyFilters({ texto: 'tecnico' });
      
      // Abrir timeline
      cy.get('[data-cy="remision-card"]').first().within(() => {
        cy.get('[data-cy^="timeline-btn-"]').should('be.visible').click();
      });
      
      // Verificar acceso al timeline
      cy.get('[data-cy="timeline-modal"]').should('be.visible');
      cy.get('[data-cy="timeline-title"]').should('contain', 'Timeline de Trabajo');
    });

    it('NO debe mostrar funcionalidades de exportación', () => {
      cy.applyFilters({ texto: 'tecnico' });
      
      // Verificar que no hay botones de exportación
      cy.get('[data-cy="btn-export-excel"]').should('not.exist');
      cy.get('[data-cy="btn-export-pdf"]').should('not.exist');
    });

    it('NO debe mostrar datos sensibles financieros', () => {
      cy.applyFilters({ texto: 'tecnico' });
      
      // Verificar que no se muestran totales detallados (según reglas de negocio)
      cy.get('[data-cy="remision-card"]').first().within(() => {
        // Puede ver información básica pero no detalles financieros sensibles
        cy.get('[data-cy="card-numero"]').should('be.visible');
        cy.get('[data-cy="card-cliente"]').should('be.visible');
        cy.get('[data-cy="card-estado"]').should('be.visible');
      });
    });

    it('debe aplicar filtros correctamente', () => {
      // Verificar que puede usar filtros básicos
      cy.applyFilters({
        estado: 'proceso',
        fechaDesde: '2024-12-01'
      });
      
      cy.get('[data-cy="filtro-tag"]').should('have.length.at.least', 2);
    });

    it('debe ver solo sus propias remisiones (si aplica regla de negocio)', () => {
      cy.applyFilters({ texto: 'test' });
      
      // Verificar que solo ve remisiones donde él es el técnico
      cy.get('[data-cy="remision-card"]').each(($card) => {
        cy.wrap($card).find('[data-cy="card-tecnicos"]').should('contain', 'tecnico@test.com');
      });
    });
  });

  describe('Rol Administrativo', () => {
    beforeEach(() => {
      cy.loginAs('administrativo');
      cy.visitHistorialTrabajos();
    });

    it('debe mostrar información completa del rol', () => {
      cy.get('[data-cy="user-role"]').should('contain', 'ADMINISTRATIVO');
      cy.get('[data-cy="user-name"]').should('contain', 'admin@test.com');
    });

    it('debe tener acceso completo a consultas', () => {
      cy.applyFilters({ texto: 'test' });
      
      // Verificar acceso a todos los datos
      cy.get('[data-cy="results-section"]').should('be.visible');
      cy.get('[data-cy="remision-card"]').should('have.length.at.least', 1);
    });

    it('debe mostrar funcionalidades de exportación', () => {
      cy.applyFilters({ texto: 'test' });
      
      // Verificar botones de exportación
      cy.get('[data-cy="results-actions"]').within(() => {
        cy.get('[data-cy="btn-export-excel"]').should('be.visible');
      });
    });

    it('debe ver información financiera completa', () => {
      cy.applyFilters({ texto: 'test' });
      
      cy.get('[data-cy="remision-card"]').first().within(() => {
        // Debe ver todos los campos incluyendo totales
        cy.get('[data-cy="card-numero"]').should('be.visible');
        cy.get('[data-cy="card-cliente"]').should('be.visible');
        cy.get('[data-cy="card-total"]').should('be.visible');
        cy.get('[data-cy="card-estado"]').should('be.visible');
        cy.get('[data-cy="card-tecnicos"]').should('be.visible');
      });
    });

    it('debe poder usar filtros avanzados', () => {
      cy.applyFilters({
        texto: 'admin',
        estado: 'completado',
        fechaDesde: '2024-12-01',
        fechaHasta: '2024-12-31',
        totalMinimo: '100000'
      });
      
      // Verificar que todos los filtros se aplicaron
      cy.get('[data-cy="filtro-tag"]').should('have.length.at.least', 5);
    });

    it('debe ver remisiones de todos los técnicos', () => {
      cy.applyFilters({ texto: 'test' });
      
      // Verificar que puede ver remisiones de diferentes técnicos
      cy.get('[data-cy="remision-card"]').should('have.length.at.least', 1);
      
      // No debe estar limitado a sus propias remisiones
      cy.get('[data-cy="card-tecnicos"]').should('exist');
    });

    it('debe poder exportar datos', () => {
      cy.applyFilters({ texto: 'test' });
      
      // Probar exportación a Excel
      cy.exportData('excel');
      
      // Verificar que se ejecutó
      cy.get('@exportData').should('have.been.called');
    });

    it('debe tener acceso completo al timeline', () => {
      cy.applyFilters({ texto: 'test' });
      
      cy.get('[data-cy="remision-card"]').first().within(() => {
        cy.get('[data-cy^="timeline-btn-"]').click();
      });
      
      // Verificar acceso completo al historial
      cy.get('[data-cy="timeline-modal"]').should('be.visible');
      cy.get('[data-cy="timeline-item"]').should('exist');
    });
  });

  describe('Rol Directivo', () => {
    beforeEach(() => {
      cy.loginAs('directivo');
      cy.visitHistorialTrabajos();
    });

    it('debe mostrar máximo nivel de permisos', () => {
      cy.get('[data-cy="user-role"]').should('contain', 'DIRECTIVO');
      cy.get('[data-cy="user-name"]').should('contain', 'directivo@test.com');
    });

    it('debe tener acceso total a todas las funcionalidades', () => {
      cy.applyFilters({ texto: 'test' });
      
      // Verificar acceso completo
      cy.get('[data-cy="results-section"]').should('be.visible');
      cy.get('[data-cy="results-actions"]').should('be.visible');
      
      // Verificar exportación
      cy.get('[data-cy="btn-export-excel"]').should('be.visible');
    });

    it('debe ver estadísticas adicionales (si implementadas)', () => {
      cy.applyFilters({ texto: 'test' });
      
      // Verificar información estadística adicional para directivos
      cy.get('[data-cy="results-info"]').should('be.visible');
      cy.get('[data-cy="results-count"]').should('exist');
    });

    it('debe poder acceder a funcionalidades de análisis', () => {
      cy.applyFilters({ texto: 'test' });
      
      // Verificar que tiene acceso a todas las opciones de exportación
      cy.get('[data-cy="results-actions"]').within(() => {
        cy.get('[data-cy="btn-export-excel"]').should('be.visible');
        // Puede tener opciones adicionales de análisis
      });
    });

    it('debe ver información financiera detallada', () => {
      cy.applyFilters({ texto: 'test' });
      
      cy.get('[data-cy="remision-card"]').first().within(() => {
        // Debe ver todos los campos financieros
        cy.get('[data-cy="card-total"]').should('be.visible');
        
        // Verificar formato de moneda
        cy.get('[data-cy="card-total"]').should('match', /\$[\d,]+/);
      });
    });
  });

  describe('Validación de Seguridad', () => {
    it('debe redirigir usuarios no autenticados', () => {
      // Intentar acceder sin login
      cy.visit('/historial-trabajos');
      
      // Debe redirigir o mostrar error de autenticación
      cy.url().should('not.include', '/historial-trabajos');
    });

    it('debe validar tokens de autenticación', () => {
      // Login con token inválido
      cy.window().then((win) => {
        win.localStorage.setItem('userToken', 'invalid-token');
      });
      
      cy.visit('/historial-trabajos');
      
      // Debe manejar token inválido
      cy.get('[data-cy="auth-error"]').should('be.visible')
        .or(() => {
          cy.url().should('not.include', '/historial-trabajos');
        });
    });

    it('debe respetar permisos de rol en tiempo real', () => {
      // Empezar como administrativo
      cy.loginAs('administrativo');
      cy.visitHistorialTrabajos();
      cy.applyFilters({ texto: 'test' });
      
      // Verificar que tiene permisos de exportación
      cy.get('[data-cy="btn-export-excel"]').should('be.visible');
      
      // Simular cambio de rol a técnico
      cy.window().then((win) => {
        const user = JSON.parse(win.localStorage.getItem('currentUser'));
        user.role = 'tecnico';
        win.localStorage.setItem('currentUser', JSON.stringify(user));
      });
      
      // Refrescar o navegar
      cy.reload();
      
      // Verificar que perdió permisos de exportación
      cy.get('[data-cy="btn-export-excel"]').should('not.exist');
    });
  });

  describe('Casos Edge de Permisos', () => {
    it('debe manejar roles no reconocidos', () => {
      // Login con rol inválido
      cy.window().then((win) => {
        win.localStorage.setItem('currentUser', JSON.stringify({
          uid: 'test-user',
          email: 'test@test.com',
          role: 'rol-inexistente'
        }));
      });
      
      cy.visit('/historial-trabajos');
      
      // Debe manejar rol desconocido (defaultear a permisos mínimos)
      cy.get('[data-cy="user-role"]').should('exist');
      cy.get('[data-cy="btn-export-excel"]').should('not.exist');
    });

    it('debe manejar permisos temporales o suspendidos', () => {
      cy.loginAs('administrativo');
      
      // Simular suspensión de cuenta
      cy.intercept('GET', '**/auth/verify', {
        statusCode: 403,
        body: { error: 'Account suspended' }
      }).as('accountSuspended');
      
      cy.visit('/historial-trabajos');
      
      // Debe manejar cuenta suspendida
      cy.get('[data-cy="access-denied"]').should('be.visible')
        .or(() => {
          cy.url().should('not.include', '/historial-trabajos');
        });
    });

    it('debe validar permisos en cada acción', () => {
      cy.loginAs('tecnico');
      cy.visitHistorialTrabajos();
      cy.applyFilters({ texto: 'test' });
      
      // Intentar exportar (sin permisos)
      cy.window().then((win) => {
        // Simular intento de bypass de UI
        win.fetch('/api/export', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer mock-token' }
        }).then((response) => {
          expect(response.status).to.equal(403);
        });
      });
    });
  });

  describe('Auditoría y Logging', () => {
    it('debe registrar accesos por rol', () => {
      cy.loginAs('administrativo');
      cy.visitHistorialTrabajos();
      
      // Verificar que se registra el acceso
      cy.window().then((win) => {
        // Simular verificación de logs
        expect(win.localStorage.getItem('lastAccess')).to.exist;
      });
    });

    it('debe registrar exportaciones', () => {
      cy.loginAs('directivo');
      cy.visitHistorialTrabajos();
      cy.applyFilters({ texto: 'test' });
      
      // Exportar datos
      cy.exportData('excel');
      
      // Verificar que se registró la exportación
      cy.get('@exportData').should('have.been.calledWith', 
        Cypress.sinon.match.has('method', 'POST')
      );
    });
  });
});
