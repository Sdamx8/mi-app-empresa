# Módulo Historial de Trabajos

## Descripción General

El módulo **Historial de Trabajos** proporciona una interfaz profesional tipo ERP para consultar, filtrar y visualizar el historial de remisiones y trabajos realizados. Incluye funcionalidades avanzadas de búsqueda, timeline de actividades y exportación de datos.

## 🚀 Características Principales

### ✅ Implementadas
- **Consulta optimizada**: Búsqueda de remisiones con paginación cursor-based
- **Filtros avanzados**: Filtrado por múltiples criterios con UI expandible
- **Timeline de trabajos**: Visualización cronológica de actividades
- **Diseño profesional**: Interface tipo ERP con Material Design
- **Responsive**: Adaptado para dispositivos móviles y desktop
- **Exportación**: Funcionalidad de exportar a Excel/PDF
- **Control de roles**: Acceso basado en roles de usuario
- **Estados de carga**: Skeleton loaders y manejo de errores

### 🔄 Funcionalidades Core
1. **Búsqueda y Filtrado**
   - Búsqueda por texto libre
   - Filtros por fechas, estado, técnico, cliente
   - Filtros aplicados visibles como tags
   - Limpieza de filtros individual o masiva

2. **Visualización de Datos**
   - Cards profesionales con información detallada
   - Estados visuales con badges de colores
   - Información organizada en grid responsive
   - Acciones contextuales por tarjeta

3. **Timeline de Historial**
   - Modal con timeline cronológico
   - Detalles de cada actividad
   - Información de técnicos y materiales
   - Navegación fluida

## 📁 Estructura del Módulo

```
src/modules/historial-trabajos/
├── index.js                           # Exportaciones principales
├── BuscarHistorialOptimizado.js       # Componente legacy (si existe)
├── components/
│   ├── HistorialTrabajosOptimizado.js # Componente principal
│   └── Historial.css                  # Estilos profesionales
├── hooks/
│   ├── useRemisiones.js              # Hook principal para datos
│   └── useEmpleadoAuth.js            # Hook de autenticación
└── README.md                         # Esta documentación
```

## 🔧 Dependencias Técnicas

### Frontend
- **React**: Hooks y componentes funcionales
- **Firebase v9**: Firestore para datos
- **CSS Custom Properties**: Variables para theming
- **Material Design**: Principios de diseño

### Backend (Servicios)
- **remisionesService**: Servicio optimizado con cursor pagination
- **AuthContext**: Gestión de autenticación y roles
- **imageService**: Manejo de imágenes (si aplica)

## 📋 Uso del Componente

### Importación Básica
```javascript
import HistorialTrabajosOptimizado from 'modules/historial-trabajos';

function App() {
  return (
    <div>
      <HistorialTrabajosOptimizado />
    </div>
  );
}
```

### Importación con Configuración
```javascript
import { 
  HistorialTrabajosOptimizado,
  useRemisiones,
  moduleConfig 
} from 'modules/historial-trabajos';

console.log('Características:', moduleConfig.features);
```

## 🎨 Personalización de Estilos

El módulo utiliza CSS Custom Properties para facilitar la personalización:

```css
:root {
  --primary-color: #1976d2;        /* Color principal */
  --secondary-color: #424242;      /* Color secundario */
  --success-color: #4caf50;        /* Color de éxito */
  --background-primary: #fafafa;   /* Fondo principal */
  /* ... más variables disponibles */
}
```

## 🔐 Control de Acceso

### Roles Soportados
- **tecnico**: Puede ver sus propias remisiones
- **administrativo**: Puede ver todas las remisiones
- **directivo**: Acceso completo + exportación

### Validación de Permisos
```javascript
// El hook useRemisiones maneja automáticamente los permisos
const { remisiones, loading, error } = useRemisiones();
```

## 📊 Estados y Filtros

### Estados de Remisión
- `pendiente`: Trabajo pendiente de iniciar
- `proceso`: En proceso de ejecución
- `completado`: Trabajo completado
- `finalizado`: Trabajo finalizado y verificado
- `facturado`: Trabajo facturado
- `cancelado`: Trabajo cancelado

### Opciones de Filtrado
- **Texto libre**: Búsqueda en múltiples campos
- **Rango de fechas**: Desde y hasta
- **Estado**: Filtro por estado específico
- **Técnico**: Filtro por técnico asignado
- **Cliente**: Filtro por cliente
- **Total mínimo**: Filtro por valor mínimo

## 🧪 Testing

### Atributos data-cy
El componente incluye atributos `data-cy` para testing automatizado:

```javascript
// Ejemplos de selectores Cypress
cy.get('[data-cy="filtros-texto"]').type('búsqueda');
cy.get('[data-cy="btn-aplicar-filtros"]').click();
cy.get('[data-cy="remision-card"]').should('be.visible');
```

### Casos de Prueba Sugeridos
1. **Carga inicial**: Verificar estado inicial y skeleton loading
2. **Aplicar filtros**: Probar diferentes combinaciones de filtros
3. **Paginación**: Verificar carga de más resultados
4. **Timeline**: Abrir y navegar timeline de historial
5. **Responsive**: Probar en diferentes tamaños de pantalla

## 🔄 Integración con Servicios

### Service Layer
```javascript
// src/services/remisionesService.js
export const remisionesService = {
  fetchRemisiones,      // Consulta principal
  fetchHistorialRemision, // Timeline de historial
  exportarDatos         // Exportación
};
```

### Cloud Functions
```javascript
// functions/exportRemisiones/
// Función para exportar datos a Excel/PDF
```

## 📱 Responsive Design

### Breakpoints
- **Desktop**: > 768px - Grid de múltiples columnas
- **Tablet**: 481px - 768px - Grid de 2 columnas
- **Mobile**: ≤ 480px - Grid de 1 columna

### Adaptaciones Móviles
- Header apilado verticalmente
- Filtros en columna única
- Acciones de tarjeta apiladas
- Modal timeline adaptado

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
# No requiere variables específicas
# Utiliza la configuración de Firebase existente
```

### Performance
- **Paginación cursor-based**: Carga eficiente de datos
- **Lazy loading**: Carga bajo demanda
- **Skeleton screens**: Mejor UX durante carga
- **Debounced search**: Búsqueda optimizada

## 🐛 Troubleshooting

### Problemas Comunes

1. **No se cargan datos**
   - Verificar permisos de Firestore
   - Comprobar roles de usuario
   - Revisar configuración de Firebase

2. **Timeline no se abre**
   - Verificar servicio de historial
   - Comprobar estructura de datos
   - Revisar permisos de lectura

3. **Filtros no funcionan**
   - Verificar estructura de campos
   - Comprobar índices de Firestore
   - Revisar validación de fechas

### Logs de Debug
```javascript
// Habilitar logs en desarrollo
localStorage.setItem('debug_historial', 'true');
```

## 🚀 Roadmap

### Próximas Características
- [ ] Gráficos y estadísticas
- [ ] Notificaciones en tiempo real
- [ ] Búsqueda por voz
- [ ] Integración con calendario
- [ ] Dashboard personalizable
- [ ] Comentarios y colaboración

## 📞 Soporte

Para soporte técnico o reportar bugs:
1. Revisar esta documentación
2. Verificar logs de consola
3. Comprobar configuración de Firebase
4. Contactar al equipo de desarrollo

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024  
**Mantenedor**: Equipo de Desarrollo ERP
