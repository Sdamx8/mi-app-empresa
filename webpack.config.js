const path = require('path');

module.exports = {
  // Configuración del servidor de desarrollo
  devServer: {
    // Solucionar problemas de WebSocket
    webSocketServer: {
      type: 'ws',
      options: {
        host: 'localhost',
        port: 3000,
      },
    },
    // Configuraciones adicionales
    hot: true,
    liveReload: true,
    compress: true,
    historyApiFallback: true,
    open: false,
    client: {
      webSocketURL: 'ws://localhost:3000/ws',
      overlay: {
        errors: true,
        warnings: false,
      },
      reconnect: 5,
    },
  },
  
  // Configuraciones para desarrollo
  resolve: {
    fallback: {
      "path": false,
      "os": false,
      "crypto": false,
    },
  },
};
