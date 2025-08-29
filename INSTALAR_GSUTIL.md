# INSTALACIÓN DE GOOGLE CLOUD SDK (OPCIONAL)

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
