# Instrucciones de Prueba - useFormRemision Corregido

## Cambios Aplicados

### 1. cargarEmpleadoActual() - CORREGIDA ✅

**Mejoras implementadas:**
- ✅ Logging detallado para depuración
- ✅ Validación robusta de `user?.email`
- ✅ Fallback con scan completo si la consulta directa falla
- ✅ Comparación case-insensitive de emails
- ✅ Manejo específico de errores de Firestore (permisos, índices)
- ✅ Lista todos los emails disponibles si no encuentra coincidencia

### 2. cargarTecnicos() - CORREGIDA ✅

**Mejoras implementadas:**
- ✅ Logging detallado de cada paso del proceso
- ✅ Consulta principal: `tipo_empleado == 'tecnico'` con `orderBy('nombre_completo')`
- ✅ Fallback robusto: busca en `cargo` si no encuentra en `tipo_empleado`
- ✅ Manejo específico de error de índices faltantes
- ✅ Advertencias útiles si no encuentra técnicos
- ✅ Lista completa de técnicos encontrados para depuración

## Pasos de Verificación

### Paso 1: Verificar Logs en Consola del Navegador

1. Abrir DevTools (F12) → Console
2. Recargar la aplicación
3. Buscar estos logs:

```
🔍 cargarEmpleadoActual: Buscando empleado con email: floresthomas24@gmail.com
📊 Búsqueda directa - documentos encontrados: 1
👤 Empleado encontrado: { id: "1012337675", nombre_completo: "Thomas Flores", ... }
✅ Campo genero actualizado con: Thomas Flores
```

```
🔧 cargarTecnicos: Iniciando carga de técnicos...
🔍 Intentando consulta directa: tipo_empleado == "tecnico"
📊 Consulta directa - técnicos encontrados: 1
👷 Técnico encontrado: { id: "1012337675", nombre_completo: "Thomas Flores", tipo_empleado: "tecnico" }
✅ Total técnicos cargados: 1
```

### Paso 2: Verificar Campo "Generó" Auto-poblado

1. Abrir formulario de remisión
2. Verificar que el campo "Generó" se llene automáticamente
3. Debe mostrar el nombre del usuario autenticado (ej: "Thomas Flores")

### Paso 3: Verificar Lista de Técnicos

1. En el formulario, buscar el select de "Técnicos"
2. Debe mostrar solo empleados con `tipo_empleado: "tecnico"`
3. Verificar que "Thomas Flores" aparezca en la lista

### Paso 4: Prueba con Email floresthomas24@gmail.com

1. Autenticarse con: `floresthomas24@gmail.com`
2. Verificar logs específicos para este email
3. Campo "Generó" debe mostrar: "Thomas Flores"

## Posibles Errores y Soluciones

### Error: "failed-precondition" (Índice Faltante)

**Síntoma:** 
```
❌ Error cargando técnicos: FirebaseError: The query requires an index
📋 ERROR DE ÍNDICE: Necesita crear un índice compuesto en Firebase Console
```

**Solución:**
1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Proyecto → Firestore Database → Indexes
3. Crear índice compuesto:
   - Colección: `EMPLEADOS`
   - Campo 1: `tipo_empleado` (Ascending)
   - Campo 2: `nombre_completo` (Ascending)

### Error: "permission-denied" (Permisos)

**Síntoma:**
```
🚫 Error de permisos: Verifique las reglas de Firestore para la colección EMPLEADOS
```

**Solución:**
Verificar reglas de Firestore en `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /EMPLEADOS/{document} {
      allow read: if request.auth != null; // Permitir lectura a usuarios autenticados
    }
  }
}
```

### No Se Encuentra Empleado

**Síntoma:**
```
❌ No se encontró empleado con email: user@example.com
💡 Emails disponibles en EMPLEADOS:
📧 { id: "1012337675", nombre: "Thomas Flores", email: "floresthomas24@gmail.com" }
```

**Solución:**
1. Verificar que el email en Firestore sea exactamente igual al email de autenticación
2. Verificar estructura: `contacto.correo` vs `email` directo
3. Usar el fallback que maneja diferencias de case

### Campo genero No Se Actualiza

**Verificaciones:**
1. `user?.email` debe tener valor válido
2. Documento en EMPLEADOS debe tener `nombre_completo`
3. Estructura debe ser `contacto.correo` (no `email` directo)

## Estructura Esperada en Firestore

### Colección EMPLEADOS
```javascript
{
  "1012337675": {
    "nombre_completo": "Thomas Flores",
    "tipo_empleado": "tecnico",
    "cargo": "LIDER TECNICO",
    "contacto": {
      "correo": "floresthomas24@gmail.com"
    }
  }
}
```

### Resultado en formData
```javascript
{
  "genero": "Thomas Flores",      // Auto-poblado desde empleado autenticado
  "tecnico": ["1012337675"],      // IDs de técnicos seleccionados
  // ... otros campos
}
```

## Comandos de Verificación

### Verificar Estado del Hook
```javascript
// En componente que usa el hook
console.log('Estado formData.genero:', formData.genero);
console.log('Lista técnicos:', tecnicos);
console.log('Usuario autenticado:', user?.email);
```

### Verificar Datos en Firestore (Firebase Console)
1. Firestore Database → Data
2. Buscar colección `EMPLEADOS`
3. Verificar documento `1012337675`
4. Confirmar campos `nombre_completo`, `tipo_empleado`, `contacto.correo`

## Validación Final

### ✅ Checklist de Funcionalidad
- [ ] Logs detallados aparecen en consola
- [ ] Campo "Generó" se auto-popula con usuario autenticado
- [ ] Lista de técnicos se carga correctamente
- [ ] Solo aparecen empleados con `tipo_empleado: "tecnico"`
- [ ] Fallback funciona si consulta directa falla
- [ ] Errores de permisos/índices se manejan apropiadamente

### 🚀 Resultado Esperado
- **genero**: Rellenado automáticamente con `nombre_completo` del usuario autenticado
- **tecnicos**: Lista poblada solo con empleados técnicos
- **Logging**: Información detallada para depuración en consola
- **Robustez**: Manejo de errores y fallbacks funcionales
