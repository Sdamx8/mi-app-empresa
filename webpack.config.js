// webpack.config.js - Configuración personalizada para desarrollo
const path = require('path');

module.exports = function override(config, env) {
  // Configuración para production - deshabilitar CSS minimizer temporalmente
  if (env === 'production') {
    if (config.optimization && config.optimization.minimizer) {
      // Filtrar el CSS minimizer para evitar errores de build
      config.optimization.minimizer = config.optimization.minimizer.filter(
        minimizer => !minimizer.constructor.name.includes('CssMinimizerPlugin')
      );
    }
  }

  // Solo aplicar en desarrollo
  if (env === 'development') {
    // Configurar el dev server para evitar errores de WebSocket
    if (config.devServer) {
      config.devServer = {
        ...config.devServer,
        // Configuración WebSocket simplificada
        client: {
          webSocketURL: 'ws://localhost:3001/ws'
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
