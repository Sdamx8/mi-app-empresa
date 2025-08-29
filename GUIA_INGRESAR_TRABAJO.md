# 🔧 Módulo Ingresar Trabajo Realizado - Guía de Usuario

## 📋 **Descripción General**

El módulo "Ingresar Trabajo Realizado" permite crear y registrar nuevas remisiones de trabajo de forma rápida e intuitiva mediante un formulario flotante interactivo.

## ✨ **Características Principales**

### **🎯 Interfaz Intuitiva**
- **Dashboard principal** con estadísticas en tiempo real
- **Formulario flotante** que se superpone sobre la aplicación
- **Validación automática** de campos obligatorios
- **Notificaciones visuales** de éxito o error
- **Accesos rápidos** a funciones principales

### **📝 Formulario Completo**
- **Campos obligatorios**: Remisión, Móvil, Descripción
- **Campos opcionales**: Subtotal, Autorizó, Carrocería, etc.
- **Selector de estado** con opciones predefinidas
- **Área de texto expandible** para descripciones largas

### **⚡ Funcionalidades Avanzadas**
- **Autoguardado** con timestamps automáticos
- **Shortcuts de teclado** (Ctrl+Enter para guardar, Escape para cerrar)
- **Validación en tiempo real** con mensajes de error específicos
- **Sistema de notificaciones** con seguimiento de ID de documento

## 🚀 **Cómo Usar el Módulo**

### **Paso 1: Acceder al Módulo**
1. Abrir la aplicación en `http://localhost:3003`
2. Iniciar sesión con credenciales Firebase
3. En el Dashboard, hacer clic en **"🔧 Ingresar Trabajo"**

### **Paso 2: Ver el Dashboard**
El dashboard muestra:
- **Estadísticas rápidas**: Remisiones del día, completadas, en proceso
- **Acciones rápidas**: Botones para funciones principales
- **Historial reciente**: Últimas remisiones creadas

### **Paso 3: Crear Nueva Remisión**
1. Hacer clic en **"➕ Nueva Remisión"** (botón principal o en acciones rápidas)
2. Se abre el formulario flotante interactivo
3. Completar los campos:

#### **Campos Obligatorios:**
- **Número de Remisión**: Código único (ej: REM-2025-001)
- **Móvil**: Identificación del vehículo (ej: MOV-001)
- **Descripción**: Detalle del trabajo realizado

#### **Campos Opcionales:**
- **Estado**: Seleccionar entre Pendiente, En Proceso, Completado, etc.
- **Subtotal**: Valor monetario del trabajo
- **Autorizó**: Persona que autorizó el trabajo
- **Carrocería**: Tipo de carrocería trabajada
- **No. Orden**: Número de orden interna
- **No. Factura Electrónica**: Número de facturación
- **Radicación**: Número de radicación
- **Generó**: Persona que generó la orden

### **Paso 4: Guardar la Remisión**
1. Hacer clic en **"💾 Guardar"** o presionar **Ctrl+Enter**
2. El sistema valida automáticamente los campos
3. Si hay errores, se muestran mensajes específicos
4. Al guardar exitosamente:
   - Aparece notificación verde con ID del documento
   - Se agrega a la lista de remisiones recientes
   - El formulario se cierra automáticamente

## 🎨 **Características de UX/UI**

### **Design System**
- **Colores consistentes** con el tema de la aplicación
- **Iconos descriptivos** para mejor navegación
- **Animaciones suaves** para transiciones
- **Responsive design** adaptable a diferentes pantallas

### **Validación Inteligente**
- **Tiempo real**: Los errores desaparecen al corregir el campo
- **Mensajes específicos**: "Móvil es obligatorio", "Subtotal debe ser un número"
- **Indicadores visuales**: Bordes rojos en campos con error

### **Shortcuts de Teclado**
- **Escape**: Cerrar el formulario sin guardar
- **Ctrl+Enter**: Guardar y cerrar rápidamente
- **Tab**: Navegación secuencial entre campos

## 🔧 **Aspectos Técnicos**

### **Arquitectura del Módulo**
```
IngresarTrabajo.js          # Componente principal con dashboard
├── FormularioRemision.js   # Modal flotante del formulario
├── useFormRemision.js      # Hook para lógica del formulario
└── constants.js            # Constantes y configuración
```

### **Integración Firebase**
- **Firestore**: Almacenamiento automático en colección 'remisiones'
- **serverTimestamp()**: Timestamps automáticos para auditoría
- **Validación**: Verificación antes de envío a base de datos

### **Estado del Formulario**
```javascript
{
  remision: '',           // String - Obligatorio
  movil: '',             // String - Obligatorio  
  estado: 'pendiente',   // String - Predefinido
  descripcion: '',       // String - Obligatorio
  subtotal: '',          // Number - Opcional
  autorizo: '',          // String - Opcional
  carroceria: '',        // String - Opcional
  no_orden: '',          // String - Opcional
  no_fact_elect: '',     // String - Opcional
  radicacion: '',        // String - Opcional
  genero: ''             // String - Opcional
}
```

## 📊 **Datos Almacenados**

### **Estructura en Firestore**
```javascript
{
  remision: "REM-2025-001",
  movil: "MOV-001",
  estado: "pendiente",
  descripcion: "Cambio de aceite y filtros",
  subtotal: 150000,
  fecha_remision: serverTimestamp(),
  fecha_id_bit: 1640995200000,
  created_at: serverTimestamp(),
  updated_at: serverTimestamp(),
  // ... campos opcionales
}
```

## 🚨 **Manejo de Errores**

### **Validaciones Implementadas**
- **Campos obligatorios**: No pueden estar vacíos
- **Formato numérico**: Subtotal debe ser número válido
- **Duplicados**: Verificación de remisión única (próximamente)

### **Mensajes de Error Comunes**
- `"Número de remisión es obligatorio"`
- `"Móvil es obligatorio"`
- `"Descripción es obligatoria"`
- `"Subtotal debe ser un número válido"`
- `"Error al guardar la remisión: [detalles]"`

## 💡 **Tips y Mejores Prácticas**

### **Para Usuarios**
1. **Usar códigos consistentes** para remisiones (ej: REM-YYYY-NNN)
2. **Descripciones detalladas** ayudan en futuras búsquedas
3. **Completar subtotal** si se requiere facturación
4. **Verificar datos** antes de guardar (no hay edición posterior)

### **Para Administradores**
1. **Monitorear Firebase Console** para verificar almacenamiento
2. **Revisar logs** en caso de errores de guardado
3. **Configurar alertas** para volúmenes altos de remisiones

## 🔮 **Próximas Mejoras**

### **Funcionalidades Planificadas**
- [ ] **Edición de remisiones** existentes
- [ ] **Duplicar remisión** para trabajos similares
- [ ] **Subir archivos adjuntos** (fotos, documentos)
- [ ] **Plantillas predefinidas** para trabajos comunes
- [ ] **Validación de duplicados** automática
- [ ] **Exportación masiva** de remisiones
- [ ] **Dashboard analytics** con gráficos y métricas

### **Mejoras de UX**
- [ ] **Autocompletado** para campos frecuentes
- [ ] **Historial de valores** usados anteriormente
- [ ] **Modo offline** para áreas sin conectividad
- [ ] **Búsqueda en tiempo real** mientras se escribe

---

**¡El módulo está listo para usar! 🎉**

Para soporte técnico o reportar problemas, contactar al equipo de desarrollo.
