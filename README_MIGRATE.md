# Migración de Remisiones - Guía Completa

## Descripción

Este script migra la estructura de datos de las remisiones desde el formato anterior al nuevo esquema optimizado:

### Transformaciones realizadas:
- **Servicios**: `servicio1`, `servicio2`, ..., `servicioN` → `servicios` (array de objetos)
- **Técnicos**: `tecnico1`, `tecnico2`, ..., `tecnicoN` → `tecnicos` (array de objetos)  
- **Estado**: Normalización a lowercase (ej: "PENDIENTE" → "pendiente")
- **Historial**: Opcionalmente crea entradas iniciales en subcolección `historial`

## Preparación

### 1. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
FIREBASE_SA_KEY_PATH=./serviceAccountKey.json
FIREBASE_PROJECT_ID=tu-proyecto-firebase-id
```

### 2. Descargar Service Account Key

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar proyecto
3. ⚙️ Configuración del proyecto → Cuentas de servicio
4. Generar nueva clave privada
5. Guardar como `serviceAccountKey.json` en la raíz del proyecto

⚠️ **IMPORTANTE**: Nunca commiteés el archivo `serviceAccountKey.json` - está en `.gitignore`

## Uso del Script

### Dry Run (Simulación - Recomendado primero)

```bash
# Ejecutar simulación (modo por defecto)
node scripts/migrate_remisiones.js

# O explícitamente
node scripts/migrate_remisiones.js --dry-run
```

**Qué hace el dry-run:**
- ✅ Analiza hasta 10 documentos de ejemplo
- ✅ Muestra transformaciones que se aplicarían
- ✅ Estadísticas de servicios y técnicos detectados
- ✅ No modifica ningún dato
- ✅ Valida configuración de Firebase

### Aplicar Migración Real

```bash
# ⚠️ MIGRACIÓN REAL - Modifica datos en Firestore
node scripts/migrate_remisiones.js --apply
```

**Qué hace --apply:**
- 🔒 Crea backup automático en `remisiones_backup_YYYYMMDD`
- 🔄 Procesa documentos en batches de 300 (seguro para Firestore)
- ✅ Transforma estructura de datos
- 📊 Muestra progreso en tiempo real
- ⏰ Agrega timestamps de migración

### Crear Historial Inicial (Opcional)

```bash
# Migración + creación de entradas iniciales en historial
node scripts/migrate_remisiones.js --apply --create-historial
```

**Qué hace --create-historial:**
- 📝 Crea entradas en `remisiones/{id}/historial/` 
- 🛠️ Una entrada por cada servicio migrado
- 👤 Asigna técnico si está disponible
- 🏷️ Marca entradas como `tipo: 'migracion_inicial'`

## Ejemplos de Transformación

### Antes (Estructura Antigua)
```javascript
{
  id: "1064",
  servicio1: "Mantenimiento preventivo",
  servicio2: "Revisión eléctrica", 
  tecnico1: "Juan Pérez",
  tecnico2: "María González",
  estado: "PENDIENTE",
  // ... otros campos
}
```

### Después (Estructura Nueva)
```javascript
{
  id: "1064",
  servicios: [
    { nombre: "Mantenimiento preventivo", numero: 1 },
    { nombre: "Revisión eléctrica", numero: 2 }
  ],
  tecnicos: [
    { nombre: "Juan Pérez", numero: 1 },
    { nombre: "María González", numero: 2 }
  ],
  estado: "pendiente",
  migratedAt: "2024-01-15T10:30:00Z",
  version: "2.0",
  // ... otros campos preservados
}
```

### Historial Inicial Creado (si --create-historial)
```javascript
// remisiones/1064/historial/{auto-id}
{
  fechaActividad: "2024-01-15T10:30:00Z",
  tecnico: "Juan Pérez", 
  actividad: "Registro inicial del servicio: Mantenimiento preventivo",
  descripcion: "Servicio migrado automáticamente desde estructura anterior (servicio1)",
  materiales: [],
  tiempoMinutos: null,
  estado: "pendiente",
  tipo: "migracion_inicial",
  servicioNumero: 1
}
```

## Seguridad y Rollback

### Backup Automático
El script crea automáticamente una colección de backup con nombre:
- `remisiones_backup_20240115` (formato: YYYYMMDD)
- Contiene **copia exacta** de todos los documentos antes de la migración

### Rollback Manual (si necesario)
```javascript
// En caso de necesitar revertir, usar Firebase Console o script:
// 1. Eliminar colección 'remisiones'  
// 2. Renombrar 'remisiones_backup_YYYYMMDD' → 'remisiones'
```

### Validación Post-Migración
```bash
# Verificar que la migración fue exitosa
node scripts/validate_migration.js  # (crear script separado si necesario)
```

## Monitoreo y Logs

### Logs del Script
- ✅ Progreso en tiempo real por batches
- 📊 Estadísticas de documentos procesados
- ⚠️ Errores y warnings detallados
- 🎯 Tiempo estimado y completado

### Verificar en Firebase Console
1. Ir a Firestore Database
2. Verificar colección `remisiones` tiene nueva estructura
3. Verificar backup existe en `remisiones_backup_YYYYMMDD`
4. Si `--create-historial`: verificar subcolecciones `historial`

## Solución de Problemas

### Error: "SERVICE ACCOUNT key no encontrado"
```bash
# Verificar path del archivo
ls -la serviceAccountKey.json

# Verificar variable de entorno
echo $FIREBASE_SA_KEY_PATH
```

### Error: "Permission denied"
- Verificar que la cuenta de servicio tiene permisos de Firestore
- Role requerido: "Firebase Admin" o "Cloud Datastore Owner"

### Error: "Batch write too large"
- El script usa batches de 300 documentos (debajo del límite de 500)
- Si persiste, revisar tamaño de documentos individuales

### Migración Parcial
```bash
# Si la migración se interrumpe, es seguro re-ejecutar:
node scripts/migrate_remisiones.js --apply

# El script detecta documentos ya migrados (campo 'version': '2.0')
```

## Testing

### Entorno de Testing
```bash
# Usar proyecto Firebase de testing
export FIREBASE_PROJECT_ID=mi-proyecto-test

# Ejecutar migración en entorno seguro
node scripts/migrate_remisiones.js --apply
```

### Validación de Datos
```javascript
// Queries para validar migración exitosa:

// 1. Contar documentos migrados
db.collection('remisiones')
  .where('version', '==', '2.0')
  .count()

// 2. Verificar estructura de servicios
db.collection('remisiones')
  .where('servicios', '!=', null)
  .limit(10)

// 3. Verificar historial creado  
db.collection('remisiones')
  .doc('1064')
  .collection('historial')
  .where('tipo', '==', 'migracion_inicial')
```

## Comandos Útiles

```bash
# Ver ayuda completa
node scripts/migrate_remisiones.js --help

# Dry run con análisis detallado  
node scripts/migrate_remisiones.js --dry-run

# Migración completa con historial
node scripts/migrate_remisiones.js --apply --create-historial

# Solo migración de estructura (sin historial)
node scripts/migrate_remisiones.js --apply
```

---

## Checklist Post-Migración

- [ ] ✅ Backup creado exitosamente
- [ ] ✅ Todos los documentos migrados (verificar count)
- [ ] ✅ Estructura de `servicios` array válida
- [ ] ✅ Estructura de `tecnicos` array válida  
- [ ] ✅ Estados normalizados a lowercase
- [ ] ✅ Campos `migratedAt` y `version` agregados
- [ ] ✅ Historial inicial creado (si aplicable)
- [ ] ✅ Frontend actualizado para nueva estructura
- [ ] ✅ Tests pasando con nueva estructura

---

**⚠️ RECORDATORIO**: Siempre ejecutar `--dry-run` primero y validar resultados antes de aplicar `--apply` en producción.
