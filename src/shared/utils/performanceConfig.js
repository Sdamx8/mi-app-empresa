// Performance optimization configuration
// Configuración para React.memo, lazy loading y optimizaciones

// Lazy loading components
export const LazyComponents = {
  HistorialTrabajosOptimizado: React.lazy(() => 
    import('../modules/historial-trabajos/components/HistorialTrabajosOptimizado')
  ),
  Empleados: React.lazy(() => 
    import('../modules/empleados/Empleados')
  ),
  HerramientaElectrica: React.lazy(() => 
    import('../modules/herramientas-electricas/HerramientaElectrica')
  ),
  HerramientaManual: React.lazy(() => 
    import('../modules/herramientas-manuales/HerramientaManual')
  ),
  InformesTecnicos: React.lazy(() => 
    import('../modules/informes-tecnicos/InformesTecnicos')
  )
};

// Performance monitoring
export const performanceConfig = {
  // Web Vitals thresholds
  vitals: {
    LCP: 2500, // Largest Contentful Paint
    FID: 100,  // First Input Delay
    CLS: 0.1   // Cumulative Layout Shift
  },
  
  // Bundle size limits
  bundles: {
    maxJSSize: 500 * 1024,      // 500KB
    maxCSSSize: 50 * 1024,      // 50KB
    maxImageSize: 200 * 1024    // 200KB
  },
  
  // Cache configuration
  cache: {
    apiCacheDuration: 5 * 60 * 1000,     // 5 minutes
    staticCacheDuration: 24 * 60 * 60 * 1000, // 24 hours
    imageCacheDuration: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

// Memoization helpers
export const MemoizedComponents = {
  // Memoize expensive components
  memo: (Component) => React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison logic
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  }),
  
  // Memoize callbacks
  useStableCallback: (callback, deps) => {
    return React.useCallback(callback, deps);
  },
  
  // Memoize computed values
  useStableValue: (computeFn, deps) => {
    return React.useMemo(computeFn, deps);
  }
};

// Performance utilities
export const PerformanceUtils = {
  // Debounce for search inputs
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Throttle for scroll events
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Intersection Observer for lazy loading
  createIntersectionObserver: (callback, options = {}) => {
    const defaultOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };
    
    return new IntersectionObserver(callback, { ...defaultOptions, ...options });
  }
};

export default {
  LazyComponents,
  performanceConfig,
  MemoizedComponents,
  PerformanceUtils
};
