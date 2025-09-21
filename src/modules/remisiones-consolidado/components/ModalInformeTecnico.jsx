/**
 * 📝 MODAL INFORME TÉCNICO - Captura de informe con fotos antes/después
 * ===================================================================
 * Modal para capturar descripción de trabajos, observaciones y fotos
 * antes/después para generar el informe técnico
 * 
 * @author: Global Mobility Solutions
 * @version: 1.0.0
 * @date: September 2025
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ModalInformeTecnico = ({ isOpen, onClose, onSave, remisionData }) => {
  const [formData, setFormData] = useState({
    descripcion_trabajos: '',
    observaciones: '',
    fotos_antes: [],
    fotos_despues: []
  });
  
  const [uploading, setUploading] = useState({
    antes: false,
    despues: false
  });

  const [dragOver, setDragOver] = useState({
    antes: false,
    despues: false
  });

  const antesInputRef = useRef(null);
  const despuesInputRef = useRef(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        descripcion_trabajos: '',
        observaciones: '',
        fotos_antes: [],
        fotos_despues: []
      });
    }
  }, [isOpen]);

  // Validate image file
  const validateImageFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB por imagen
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Solo se permiten imágenes JPG, PNG o WEBP');
    }

    if (file.size > maxSize) {
      throw new Error('Cada imagen no debe superar 5MB');
    }

    return true;
  };

  // Create image preview
  const createImagePreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          file,
          preview: e.target.result,
          name: file.name,
          size: file.size,
          id: Date.now() + Math.random()
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (files, type) => {
    if (!files || files.length === 0) return;

    setUploading(prev => ({ ...prev, [type]: true }));

    try {
      const validFiles = [];
      const previews = [];

      for (let file of files) {
        validateImageFile(file);
        validFiles.push(file);
        const preview = await createImagePreview(file);
        previews.push(preview);
      }

      setFormData(prev => ({
        ...prev,
        [`fotos_${type}`]: [...prev[`fotos_${type}`], ...previews]
      }));

    } catch (error) {
      console.error(`Error processing images:`, error);
      alert(error.message);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  }, []);

  // Handle input change for images
  const handleImageInputChange = useCallback((e, type) => {
    handleFileSelect(e.target.files, type);
    // Reset input
    e.target.value = '';
  }, [handleFileSelect]);

  // Handle drag and drop
  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
    
    const files = e.dataTransfer.files;
    handleFileSelect(files, type);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: true }));
  }, []);

  const handleDragLeave = useCallback((e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
  }, []);

  // Remove image
  const removeImage = useCallback((imageId, type) => {
    setFormData(prev => ({
      ...prev,
      [`fotos_${type}`]: prev[`fotos_${type}`].filter(img => img.id !== imageId)
    }));
  }, []);

  // Handle text input change
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.descripcion_trabajos.trim()) {
      alert('La descripción de trabajos es requerida');
      return;
    }

    if (formData.fotos_antes.length === 0) {
      alert('Debe subir al menos una foto de antes');
      return;
    }

    if (formData.fotos_despues.length === 0) {
      alert('Debe subir al menos una foto de después');
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      fotos_antes: formData.fotos_antes.map(img => img.file),
      fotos_despues: formData.fotos_despues.map(img => img.file),
      remision_id: remisionData?.firestoreId,
      remision_numero: remisionData?.remision,
      movil: remisionData?.movil,
      no_orden: remisionData?.no_orden
    };

    onSave(submitData);
  }, [formData, remisionData, onSave]);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.3 }}
          className="modal-informe"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="modal-title">
              <h2>📝 Crear Informe Técnico</h2>
              {remisionData && (
                <div className="remision-info">
                  <span>Remisión: {remisionData.remision}</span>
                  <span>Móvil: {remisionData.movil}</span>
                  <span>Orden: {remisionData.no_orden}</span>
                </div>
              )}
            </div>
            <button 
              className="btn-close-modal"
              onClick={onClose}
              type="button"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="modal-content">
            {/* Descripción de Trabajos */}
            <div className="form-group">
              <label htmlFor="descripcion_trabajos">
                <span className="required">*</span> Descripción de Trabajos Realizados
              </label>
              <textarea
                id="descripcion_trabajos"
                name="descripcion_trabajos"
                value={formData.descripcion_trabajos}
                onChange={handleInputChange}
                placeholder="Describa detalladamente los trabajos realizados..."
                rows={4}
                className="form-textarea"
                required
              />
            </div>

            {/* Observaciones */}
            <div className="form-group">
              <label htmlFor="observaciones">
                Observaciones Adicionales
              </label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                placeholder="Observaciones, recomendaciones o notas adicionales..."
                rows={3}
                className="form-textarea"
              />
            </div>

            {/* Fotos Antes */}
            <div className="form-group">
              <label>
                <span className="required">*</span> Fotos Antes
              </label>
              <div 
                className={`photo-upload-zone ${dragOver.antes ? 'drag-over' : ''}`}
                onDrop={(e) => handleDrop(e, 'antes')}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, 'antes')}
                onDragLeave={(e) => handleDragLeave(e, 'antes')}
                onClick={() => antesInputRef.current?.click()}
              >
                {uploading.antes ? (
                  <div className="uploading">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="upload-spinner"
                    />
                    <span>Procesando imágenes...</span>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <span className="upload-icon">📷</span>
                    <span className="upload-text">Subir Fotos de Antes</span>
                    <span className="upload-hint">JPG, PNG, WEBP - Max 5MB cada una</span>
                  </div>
                )}
              </div>

              <input
                ref={antesInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => handleImageInputChange(e, 'antes')}
                style={{ display: 'none' }}
                multiple
              />

              {/* Preview Fotos Antes */}
              {formData.fotos_antes.length > 0 && (
                <div className="photos-preview">
                  <h4>Fotos de Antes ({formData.fotos_antes.length})</h4>
                  <div className="photos-grid">
                    {formData.fotos_antes.map((img) => (
                      <div key={img.id} className="photo-preview">
                        <img src={img.preview} alt={img.name} />
                        <div className="photo-overlay">
                          <span className="photo-name">{img.name}</span>
                          <span className="photo-size">{formatFileSize(img.size)}</span>
                          <button
                            type="button"
                            className="btn-remove-photo"
                            onClick={() => removeImage(img.id, 'antes')}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fotos Después */}
            <div className="form-group">
              <label>
                <span className="required">*</span> Fotos Después
              </label>
              <div 
                className={`photo-upload-zone ${dragOver.despues ? 'drag-over' : ''}`}
                onDrop={(e) => handleDrop(e, 'despues')}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, 'despues')}
                onDragLeave={(e) => handleDragLeave(e, 'despues')}
                onClick={() => despuesInputRef.current?.click()}
              >
                {uploading.despues ? (
                  <div className="uploading">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="upload-spinner"
                    />
                    <span>Procesando imágenes...</span>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <span className="upload-icon">📷</span>
                    <span className="upload-text">Subir Fotos de Después</span>
                    <span className="upload-hint">JPG, PNG, WEBP - Max 5MB cada una</span>
                  </div>
                )}
              </div>

              <input
                ref={despuesInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => handleImageInputChange(e, 'despues')}
                style={{ display: 'none' }}
                multiple
              />

              {/* Preview Fotos Después */}
              {formData.fotos_despues.length > 0 && (
                <div className="photos-preview">
                  <h4>Fotos de Después ({formData.fotos_despues.length})</h4>
                  <div className="photos-grid">
                    {formData.fotos_despues.map((img) => (
                      <div key={img.id} className="photo-preview">
                        <img src={img.preview} alt={img.name} />
                        <div className="photo-overlay">
                          <span className="photo-name">{img.name}</span>
                          <span className="photo-size">{formatFileSize(img.size)}</span>
                          <button
                            type="button"
                            className="btn-remove-photo"
                            onClick={() => removeImage(img.id, 'despues')}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="btn btn-primary"
                disabled={
                  !formData.descripcion_trabajos.trim() ||
                  formData.fotos_antes.length === 0 ||
                  formData.fotos_despues.length === 0 ||
                  uploading.antes ||
                  uploading.despues
                }
              >
                💾 Guardar Informe
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ModalInformeTecnico;