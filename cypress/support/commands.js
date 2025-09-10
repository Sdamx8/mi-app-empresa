/**
 * Comandos personalizados de Cypress para Historial de Trabajos
 */

// Comando para login de usuario
Cypress.Commands.add('loginAs', (role = 'administrativo') => {
  const users = {
    tecnico: {
      email: 'tecnico@test.com',
      uid: 'tecnico-test-id',
      role: 'tecnico'
    },
    administrativo: {
      email: 'admin@test.com',
      uid: 'admin-test-id', 
      role: 'administrativo'
    },
    directivo: {
      email: 'directivo@test.com',
      uid: 'directivo-test-id',
      role: 'directivo'
    }
  };

  const user = users[role];
  
  // Simular login en localStorage
  cy.window().then((win) => {
    win.localStorage.setItem('currentUser', JSON.stringify(user));
    win.localStorage.setItem('userToken', 'mock-token');
  });

  // Interceptar verificación de auth
  cy.intercept('GET', '**/auth/verify', {
    statusCode: 200,
    body: { user, authenticated: true }
  }).as('authVerify');
});

// Comando para navegar al módulo de historial
Cypress.Commands.add('visitHistorialTrabajos', () => {
  cy.visit('/historial-trabajos');
  cy.wait('@firestoreQuery', { timeout: 10000 });
});

// Comando para aplicar filtros
Cypress.Commands.add('applyFilters', (filters) => {
  // Expandir filtros si están colapsados
  cy.get('[data-cy="expand-filtros"]').then(($btn) => {
    if (!$btn.hasClass('expanded')) {
      cy.get('[data-cy="expand-filtros"]').click();
    }
  });

  // Aplicar filtros según los parámetros
  if (filters.texto) {
    cy.get('[data-cy="filtros-texto"]').clear().type(filters.texto);
  }

  if (filters.estado) {
    cy.get('[data-cy="filtros-estado"]').select(filters.estado);
  }

  if (filters.fechaDesde) {
    cy.get('[data-cy="filtros-fecha-desde"]').type(filters.fechaDesde);
  }

  if (filters.fechaHasta) {
    cy.get('[data-cy="filtros-fecha-hasta"]').type(filters.fechaHasta);
  }

  if (filters.tecnico) {
    cy.get('[data-cy="filtros-tecnico"]').type(filters.tecnico);
  }

  if (filters.cliente) {
    cy.get('[data-cy="filtros-cliente"]').type(filters.cliente);
  }

  if (filters.totalMinimo) {
    cy.get('[data-cy="filtros-total-minimo"]').type(filters.totalMinimo);
  }

  // Aplicar filtros
  cy.get('[data-cy="btn-aplicar-filtros"]').click();
  cy.wait('@firestoreQuery');
});

// Comando para limpiar filtros
Cypress.Commands.add('clearFilters', () => {
  cy.get('[data-cy="expand-filtros"]').then(($btn) => {
    if (!$btn.hasClass('expanded')) {
      cy.get('[data-cy="expand-filtros"]').click();
    }
  });

  cy.get('[data-cy="btn-limpiar-filtros"]').click();
  cy.wait('@firestoreQuery');
});

// Comando para abrir timeline de una remisión
Cypress.Commands.add('openTimeline', (remisionId) => {
  // Mock para historial de la remisión
  cy.intercept('GET', `**/historial/${remisionId}`, {
    statusCode: 200,
    body: [
      {
        id: 'hist-1',
        fecha: '2024-12-01T10:00:00Z',
        tecnico: 'Juan Pérez',
        actividad: 'Inicio de trabajo',
        descripcion: 'Se inició el trabajo',
        materiales: ['Material 1'],
        tiempoInvertido: 120
      }
    ]
  }).as('fetchHistorial');

  cy.get(`[data-cy="timeline-btn-${remisionId}"]`).click();
  cy.wait('@fetchHistorial');
});

// Comando para cerrar timeline
Cypress.Commands.add('closeTimeline', () => {
  cy.get('[data-cy="close-timeline"]').click();
});

// Comando para cargar más resultados
Cypress.Commands.add('loadMoreResults', () => {
  cy.get('[data-cy="btn-cargar-mas"]').click();
  cy.wait('@firestoreQuery');
});

// Comando para exportar datos
Cypress.Commands.add('exportData', (format = 'excel') => {
  // Mock para Cloud Function de exportación
  cy.intercept('POST', '**/exportRemisiones', {
    statusCode: 200,
    body: {
      downloadUrl: 'https://storage.googleapis.com/test-bucket/export.xlsx',
      fileName: `historial_${new Date().toISOString().split('T')[0]}.xlsx`
    }
  }).as('exportData');

  cy.get(`[data-cy="btn-export-${format}"]`).click();
  cy.wait('@exportData');
});

// Comando para verificar estructura de remisión
Cypress.Commands.add('verifyRemisionCard', (remisionData) => {
  cy.get(`[data-cy="remision-card-${remisionData.id}"]`).within(() => {
    // Verificar número de remisión
    cy.get('[data-cy="card-numero"]').should('contain', remisionData.numeroRemision);
    
    // Verificar cliente
    cy.get('[data-cy="card-cliente"]').should('contain', remisionData.cliente);
    
    // Verificar estado
    cy.get('[data-cy="card-estado"]').should('contain', remisionData.estado.toUpperCase());
    
    // Verificar fecha
    cy.get('[data-cy="card-fecha"]').should('contain', remisionData.fecha);
    
    // Verificar móvil
    cy.get('[data-cy="card-movil"]').should('contain', remisionData.movil);
    
    // Verificar total si está presente
    if (remisionData.total) {
      cy.get('[data-cy="card-total"]').should('contain', remisionData.total.toLocaleString());
    }
  });
});

// Comando para verificar responsive design
Cypress.Commands.add('testResponsive', () => {
  const viewports = [
    { device: 'mobile', width: 375, height: 667 },
    { device: 'tablet', width: 768, height: 1024 },
    { device: 'desktop', width: 1280, height: 720 }
  ];

  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    cy.get('[data-cy="historial-container"]').should('be.visible');
    
    // Verificar que los elementos se adapten
    if (viewport.device === 'mobile') {
      cy.get('[data-cy="remisiones-grid"]').should('have.css', 'grid-template-columns', '1fr');
    } else if (viewport.device === 'tablet') {
      // Verificar layout de tablet
      cy.get('[data-cy="remisiones-grid"]').should('be.visible');
    } else {
      // Verificar layout de desktop
      cy.get('[data-cy="remisiones-grid"]').should('be.visible');
    }
  });
});

// Comando para simular datos de prueba
Cypress.Commands.add('mockRemisionesData', (remisiones = []) => {
  const defaultRemisiones = [
    {
      id: 'rem-001',
      numeroRemision: 'REM-001',
      fecha: '2024-12-01',
      cliente: 'Cliente Test 1',
      movil: 'MOV-001',
      estado: 'completado',
      servicios: ['Servicio 1'],
      tecnicos: ['Juan Pérez'],
      total: 250000
    },
    {
      id: 'rem-002',
      numeroRemision: 'REM-002',
      fecha: '2024-12-02',
      cliente: 'Cliente Test 2',
      movil: 'MOV-002',
      estado: 'proceso',
      servicios: ['Servicio 2'],
      tecnicos: ['María García'],
      total: 150000
    }
  ];

  const testData = remisiones.length > 0 ? remisiones : defaultRemisiones;

  cy.intercept('POST', '**/firestore.googleapis.com/**', {
    statusCode: 200,
    body: {
      documents: testData.map(rem => ({
        name: `projects/test/databases/(default)/documents/remisiones/${rem.id}`,
        fields: Object.keys(rem).reduce((acc, key) => {
          acc[key] = { stringValue: rem[key].toString() };
          return acc;
        }, {}),
        createTime: '2024-12-01T00:00:00Z',
        updateTime: '2024-12-01T00:00:00Z'
      }))
    }
  }).as('mockRemisiones');
});

// Comando para verificar accesibilidad básica
Cypress.Commands.add('checkAccessibility', () => {
  // Verificar que hay elementos focusables
  cy.get('button, input, select, textarea, a[href]').should('exist');
  
  // Verificar que los botones tienen texto o aria-label
  cy.get('button').each(($btn) => {
    cy.wrap($btn).should(($el) => {
      const text = $el.text().trim();
      const ariaLabel = $el.attr('aria-label');
      expect(text || ariaLabel).to.not.be.empty;
    });
  });
  
  // Verificar que los inputs tienen labels
  cy.get('input').each(($input) => {
    cy.wrap($input).should(($el) => {
      const id = $el.attr('id');
      const ariaLabel = $el.attr('aria-label');
      if (id) {
        cy.get(`label[for="${id}"]`).should('exist');
      } else {
        expect(ariaLabel).to.not.be.empty;
      }
    });
  });
});

// Comando para test de performance básico
Cypress.Commands.add('measurePerformance', (actionName) => {
  cy.window().then((win) => {
    // Marcar inicio
    win.performance.mark(`${actionName}-start`);
  });

  return {
    end: () => {
      cy.window().then((win) => {
        // Marcar fin y medir
        win.performance.mark(`${actionName}-end`);
        win.performance.measure(actionName, `${actionName}-start`, `${actionName}-end`);
        
        // Obtener medición
        const measure = win.performance.getEntriesByName(actionName)[0];
        cy.log(`${actionName} took: ${measure.duration.toFixed(2)}ms`);
        
        // Verificar que no tardó más de 2 segundos
        expect(measure.duration).to.be.lessThan(2000);
      });
    }
  };
});
