// Supprimir mensaje de React DevTools en desarrollo
if (typeof window !== 'undefined') {
  // Interceptar console.info para filtrar el mensaje de React DevTools
  const originalInfo = console.info;
  console.info = function(...args) {
    // Filtrar el mensaje específico de React DevTools
    if (args.length > 0 && typeof args[0] === 'string' && 
        args[0].includes('Download the React DevTools')) {
      return; // No mostrar este mensaje
    }
    originalInfo.apply(console, args);
  };
  
  // También interceptar console.log por si viene por ahí
  const originalLog = console.log;
  console.log = function(...args) {
    if (args.length > 0 && typeof args[0] === 'string' && 
        args[0].includes('Download the React DevTools')) {
      return; // No mostrar este mensaje
    }
    originalLog.apply(console, args);
  };
}
