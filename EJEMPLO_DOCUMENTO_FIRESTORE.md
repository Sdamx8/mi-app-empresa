# Ejemplo de Documento en Firestore - Remisiones

## Estructura del documento tal como se almacena en Firestore

### ID del Documento
El documento se almacena con el **ID igual al número de remisión** (ejemplo: "1292")

### Estructura de datos:

```json
{
  "remision": "1292",
  "autorizo": "FABIAN GIRALDO",
  "carroceria": "VOLVO-B215RH",
  "descripcion": [
    "MANTENIMIENTO PREVENTIVO CLARABOYA 1, 2 Y 3",
    "VERIFICACIÓN SISTEMA ELÉCTRICO",
    "REVISIÓN DE FRENOS"
  ],
  "estado": "GENERADO",
  "fecha_remision": "26/08/2025",
  "fecha_bit_prof": "28/08/2025",
  "fecha_maximo": "30/08/2025",
  "radicacion": "02/09/2025",
  "no_id_bit": "133445",
  "no_fact_elect": "FVGM-144",
  "no_orden": "JU1601526",
  "movil": "7194",
  "genero": "Sergio Dabian Ayala Mondragón",
  "tecnico": [
    "Thomas Flores",
    "Carlos Martinez",
    "Juan Perez"
  ],
  "subtotal": "180000",
  "total": "214200",
  "une": "SANJOSE1",
  "created_at": "2025-08-26T10:30:00.000Z",
  "updated_at": "2025-08-26T10:30:00.000Z"
}
```

## Reglas implementadas:

### 1. Estado
- **Valor preseleccionado:** "GENERADO"
- **Tipo:** Lista desplegable con opciones fijas

### 2. Técnico
- **Fuente:** Colección `empleados` filtrada por `cargo = "Técnico"`
- **Tipo:** Lista múltiple de checkboxes
- **Almacenamiento:** Array de nombres completos (strings)

### 3. Genero
- **Fuente:** Usuario autenticado de la colección `empleados`
- **Valor:** Campo `nombre_completo` del usuario logueado
- **Tipo:** Campo automático, no editable

### 4. Descripción
- **Fuente:** Colección `servicios`, campo `titulo`
- **Tipo:** Lista múltiple de checkboxes
- **Almacenamiento:** Array de títulos de servicios (strings)

### 5. Autorizo
- **Tipo:** Campo de texto editable
- **Valor:** Se puede ingresar manualmente

### 6. Subtotal
- **Cálculo:** Suma de los campos `costo` de todos los servicios seleccionados
- **Formato visual:** Con separadores de miles (ej: $180,000)
- **Almacenamiento:** String sin formato (ej: "180000")
- **Editable:** No (calculado automáticamente)

### 7. Total
- **Cálculo:** subtotal + (subtotal * 0.19)
- **Formato visual:** Con separadores de miles (ej: $214,200)
- **Almacenamiento:** String sin formato (ej: "214200")
- **Editable:** No (calculado automáticamente)

### 8. Fechas
- **Formato almacenamiento:** DD/MM/YYYY como string
- **Campos:** fecha_remision, fecha_bit_prof, fecha_maximo, radicacion

### 9. Validaciones obligatorias
- remision (número de remisión)
- fecha_remision
- movil
- descripcion (al menos un servicio)
- tecnico (al menos un técnico)

## Flujo de guardado:

1. El usuario llena el formulario
2. Se validan los campos obligatorios
3. Se formatean las fechas a DD/MM/YYYY
4. Se calculan subtotal y total automáticamente
5. Se crea el documento en Firestore con ID = número de remisión
6. Todos los campos se almacenan como strings para evitar conflictos en reportes

## Integración con reportes:

Al almacenar todos los campos como strings con el formato específico, se garantiza:
- Consistencia en los datos
- Compatibilidad con sistemas de reportes
- Fácil consulta y filtrado
- Evita errores de tipo de datos
