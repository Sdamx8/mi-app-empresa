// ✅ FLUJO CORREGIDO:
// 1. Obtener datos desde Firestore (solo URLs)
// 2. Generar base64 dinámicamente para PDF
// 3. Combinar datos + base64 temporal
// 4. Generar PDF con imágenes base64
// 5. NO guardar base64 en Firestore# INSTALACIÓN DE GOOGLE CLOUD SDK (OPCIONAL)

## Para Windows:

1. **Descargar Google Cloud SDK**:
   - Ve a: https://cloud.google.com/sdk/docs/install
   - Descarga el instalador para Windows

2. **Instalar y configurar**:
   ```cmd
   # Después de instalar, abrir nueva terminal
   gcloud auth login
   gcloud config set project global-flow-db
   ```

3. **Aplicar CORS**:
   ```cmd
   gsutil cors set cors.json gs://global-flow-db.firebasestorage.app
   ```

## PERO POR AHORA...

**Usa Firebase Console** (Método 1) que es más rápido y no requiere instalaciones adicionales.

Una vez configurado CORS, tu aplicación podrá usar Firebase Storage directamente en lugar del fallback base64.
