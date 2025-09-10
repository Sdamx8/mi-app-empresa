/**
 * Cypress E2E Support File
 * Comandos personalizados y configuración para testing de Historial de Trabajos
 */

import './commands';

// Configuración global
Cypress.config('defaultCommandTimeout', 10000);

// Manejar excepciones no capturadas
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignorar errores específicos de Firebase en testing
  if (err.message.includes('Firebase')) {
    return false;
  }
  // Ignorar errores de red durante testing
  if (err.message.includes('NetworkError')) {
    return false;
  }
  return true;
});

// Configurar antes de cada test
beforeEach(() => {
  // Interceptar llamadas a Firebase
  cy.intercept('POST', '**/identitytoolkit.googleapis.com/**', {
    statusCode: 200,
    body: {
      localId: 'test-user-id',
      email: 'test@example.com',
      idToken: 'mock-id-token',
      refreshToken: 'mock-refresh-token'
    }
  }).as('firebaseAuth');

  // Interceptar llamadas a Firestore
  cy.intercept('POST', '**/firestore.googleapis.com/**', {
    statusCode: 200,
    body: {
      documents: []
    }
  }).as('firestoreQuery');

  // Configurar viewport por defecto
  cy.viewport(1280, 720);
});

// Limpiar después de cada test
afterEach(() => {
  // Limpiar localStorage
  cy.clearLocalStorage();
  
  // Limpiar cookies
  cy.clearCookies();
});

// Configurar antes de todos los tests
before(() => {
  // Configurar emuladores de Firebase si están disponibles
  if (Cypress.env('FIREBASE_AUTH_EMULATOR_HOST')) {
    cy.log('Usando Firebase Auth Emulator');
  }
  
  if (Cypress.env('FIRESTORE_EMULATOR_HOST')) {
    cy.log('Usando Firestore Emulator');
  }
});
