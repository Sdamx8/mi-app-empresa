/**
 * 🎨 GLOBAL MOBILITY SOLUTIONS - TOKENS DE DISEÑO
 * ================================================
 * Sistema de tokens para mantener consistencia en la identidad corporativa
 * Versión: 2.0 - Manual de Identidad Corporativa
 * Actualizado: Septiembre 2025
 */

export const THEME = {
  colors: {
    // Paleta principal corporativa
    primary: '#1E3C72',        // Azul profundo corporativo
    secondary: '#5DADE2',      // Azul claro para acentos
    success: '#27AE60',        // Verde para éxito
    warning: '#F1C40F',        // Amarillo para advertencias
    danger: '#E74C3C',         // Rojo para errores/peligro
    info: '#3498DB',           // Azul para información
    
    // Colores de fondo y superficie
    background: '#F8F9FA',     // Fondo principal de la aplicación
    surface: '#FFFFFF',        // Fondo de cards y contenedores
    
    // Colores de texto
    text: '#212529',          // Texto principal
    muted: '#6C757D',         // Texto secundario/deshabilitado
    
    // Colores de apoyo
    border: '#E9ECEF',        // Bordes sutiles
    divider: '#DEE2E6',       // Líneas divisorias
    disabled: '#ADB5BD',      // Elementos deshabilitados
    
    // Mantenemos compatibilidad con el código existente
    dark: '#1e3c72'
  },
  
  font: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
    sans: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" // Mantener compatibilidad
  },
  
  fontSize: {
    // Jerarquía según manual de marca
    h1: '28px',          // Títulos principales
    h2: '22px',          // Subtítulos
    h3: '18px',          // Encabezados de sección
    body: '16px',        // Texto base
    small: '14px',       // Texto pequeño
    xs: '12px'           // Texto extra pequeño
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,       // Según manual para títulos
    bold: 700
  },
  
  spacing: {
    xs: 4,               // 0.25rem
    sm: 8,               // 0.5rem - Espacio mínimo del logo
    md: 16,              // 1rem
    lg: 24,              // 1.5rem - Espaciado entre secciones según manual
    xl: 40,              // 2.5rem
    xxl: 48              // 3rem
  },
  
  radius: {
    none: 0,
    sm: 4,
    base: 8,             // Radio principal según manual
    lg: 12,
    pill: 20,
    full: 9999
  },
  
  shadow: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0, 0, 0, 0.05)',      // Sombra principal para cards según manual
    lg: '0 4px 6px rgba(0, 0, 0, 0.07)',
    xl: '0 8px 25px rgba(0, 0, 0, 0.15)',     // Para hover effects
    header: '0 2px 10px rgba(0, 0, 0, 0.1)'   // Sombra suave para header
  },
  
  transitions: {
    fast: '150ms',
    normal: '300ms',     // Duración estándar según manual
    slow: '500ms',
    all: 'all 300ms ease-in-out'
  },
  
  breakpoints: {
    sm: '640px',         // Mobile landscape
    md: '768px',         // Tablet
    lg: '1024px',        // Desktop
    xl: '1280px',        // Large desktop
    xxl: '1400px'        // Desktop máximo según manual
  },
  
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    modal: 1050,         // Modales
    toast: 1080          // Notificaciones
  }
};
