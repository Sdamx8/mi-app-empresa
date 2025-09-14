# 🔄 RESTAURACIÓN RÁPIDA - MÓDULO INGRESAR TRABAJO

## 🚨 ¿NECESITAS RESTAURAR EL MÓDULO?

Si algo sale mal durante los próximos ajustes, aquí tienes **3 formas** de restaurar el estado funcional:

---

## 🎯 OPCIÓN 1: RESTAURAR DESDE BACKUP LOCAL (RECOMENDADO)

```bash
# 1. Ir al directorio del proyecto
cd c:\Users\USUARIO\mi-app-empresa

# 2. Respaldar estado actual (por seguridad)
robocopy "src\modules\ingresar-trabajo" "temp-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')" /E

# 3. Restaurar desde backup funcional
robocopy "backups\ingresar-trabajo-2025-09-14" "src\modules\ingresar-trabajo" /E /PURGE

# 4. Verificar que funciona
npm start
```

---

## 📚 OPCIÓN 2: RESTAURAR DESDE GIT

```bash
# Ver historial de commits
git log --oneline -10

# Restaurar al commit de restauración (ID: c345b78)
git reset --hard c345b78

# O restaurar solo el módulo específico
git checkout c345b78 -- src/modules/ingresar-trabajo/
```

---

## 🛠️ OPCIÓN 3: VERIFICACIÓN MANUAL

### Archivos que DEBEN existir y funcionar:
- ✅ `src/modules/ingresar-trabajo/components/RemisionesSpreadsheet.jsx`
- ✅ `src/modules/ingresar-trabajo/components/RemisionesSpreadsheet.css`
- ✅ `src/modules/ingresar-trabajo/components/ServicioSelect.jsx`
- ✅ `src/modules/ingresar-trabajo/hooks/useFirestoreHooks.js`

### Test rápido de funcionalidad:
1. **Servidor inicia sin errores**: `npm start`
2. **Módulo carga**: Navegar a "Ingresar Trabajo"
3. **Dropdowns funcionan**: Servicios y técnicos se cargan
4. **Guardado funciona**: Crear una remisión de prueba

---

## 🎛️ CONFIGURACIONES CRÍTICAS

### Variables de entorno necesarias:
```bash
REACT_APP_FIREBASE_API_KEY=your-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project
```

### Dependencias críticas (package.json):
```json
{
  "react": "^19.1.0",
  "framer-motion": "^12.23.12",
  "firebase": "^10.x.x"
}
```

### Firestore Collections requeridas:
- `servicios` (títulos y costos)
- `EMPLEADOS` (técnicos disponibles)
- `remisiones` (donde se guardan los datos)

---

## 🚑 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Cannot find module"
```bash
npm install --legacy-peer-deps
```

### Error: "Firestore permissions"
```bash
firebase deploy --only firestore:rules
```

### Error: "Hook not found"
```bash
# Verificar que useFirestoreHooks.js existe
ls -la src/modules/ingresar-trabajo/hooks/
```

### Error: "Component not rendering"
```bash
# Verificar compilación
npm run build
```

---

## 📱 CONTACTO DE EMERGENCIA

**Si nada funciona**, tienes la documentación completa en:
- 📄 `backups/ingresar-trabajo-2025-09-14/PUNTO_RESTAURACION.md`
- 🔄 Commit ID: `c345b78`
- 📅 Fecha backup: 14 Sep 2025, 11:43 AM

**Estado garantizado**: ✅ COMPLETAMENTE FUNCIONAL

---

## ⚡ COMANDOS RÁPIDOS

```bash
# Todo en uno - Restauración completa
git reset --hard c345b78 && npm install --legacy-peer-deps && npm start

# Solo restaurar archivos del módulo
robocopy "backups\ingresar-trabajo-2025-09-14" "src\modules\ingresar-trabajo" /E /PURGE

# Verificar estado actual
git status && npm start
```

---

**🎯 OBJETIVO**: Siempre volver a un estado 100% funcional en menos de 2 minutos.