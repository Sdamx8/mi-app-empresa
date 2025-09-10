// webpack.config.js - Configuración personalizada para desarrollo
const path = require('path');

module.exports = function override(config, env) {
  // Solo aplicar en desarrollo
  if (env === 'development') {
    // Configurar el dev server para evitar errores de WebSocket
    if (config.devServer) {
      config.devServer = {
        ...config.devServer,
        // Configuración WebSocket
        webSocketServer: {
          type: 'ws',
          options: {
            host: 'localhost',
            port: 3001
          }
        },
        // Suprimir ciertos logs
        client: {
          logging: 'warn', // Solo mostrar warnings y errores
          overlay: {
            warnings: false,
            errors: true
          },
          reconnect: 5 // Intentos de reconexión reducidos
        },
        // Headers para evitar problemas CORS en desarrollo
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
        }
      };
    }
  }
  
  return config;
};
