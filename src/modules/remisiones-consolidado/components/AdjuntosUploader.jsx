/**
 * 📎 ADJUNTOS UPLOADER - Subida de orden PDF y remisión escaneada
 * =============================================================
 * Componente para subir archivos adjuntos (orden de trabajo PDF y remisión escaneada)
 * a Firebase Storage con validación y preview
 * 
 * @author: Global Mobility Solutions
 * @version: 1.0.0
 * @date: September 2025
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AdjuntosUploader = ({ row, rowIndex, onUpload, disabled = false }) => {
  const [uploading, setUploading] = useState({
    orden: false,
    remision: false
  });
  const [dragOver, setDragOver] = useState({
    orden: false,
    remision: false
  });

  const ordenFileInputRef = useRef(null);
  const remisionFileInputRef = useRef(null);

  // Validate file type and size
  const validateFile = (file, type) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (type === 'orden') {
      // Orden debe ser PDF
      if (file.type !== 'application/pdf') {
        throw new Error('La orden de trabajo debe ser un archivo PDF');
      }
    } else if (type === 'remision') {
      // Remisión puede ser PDF o imagen
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('La remisión debe ser PDF, JPG, PNG o WEBP');
      }
    }

    if (file.size > maxSize) {
      throw new Error('El archivo no debe superar 10MB');
    }

    return true;
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (files, type) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    try {
      validateFile(file, type);
      
      setUploading(prev => ({ ...prev, [type]: true }));

      const fileData = {
        [type]: file
      };

      await onUpload(rowIndex, fileData);

    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      alert(error.message);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  }, [rowIndex, onUpload]);

  // Handle input change
  const handleInputChange = useCallback((e, type) => {
    handleFileSelect(e.target.files, type);
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

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Extract filename from URL
  const getFilenameFromUrl = (url) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      return path.split('/').pop() || 'archivo';
    } catch {
      return 'archivo';
    }
  };

  const hasOrden = row.adjuntos?.orden_url;
  const hasRemision = row.adjuntos?.remision_url;

  return (
    <div className="adjuntos-uploader">
      {/* Orden de Trabajo */}
      <div className="adjunto-section">
        <div className="adjunto-label">
          <span>📄 Orden PDF</span>
          {hasOrden && <span className="adjunto-status success">✓</span>}
        </div>
        
        {hasOrden ? (
          <div className="adjunto-uploaded">
            <div className="file-info">
              <span className="filename">{getFilenameFromUrl(hasOrden)}</span>
              <div className="file-actions">
                <a 
                  href={hasOrden} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-view-file"
                  title="Ver archivo"
                >
                  👁️
                </a>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => ordenFileInputRef.current?.click()}
                  className="btn-replace-file"
                  disabled={disabled || uploading.orden}
                  title="Reemplazar archivo"
                >
                  🔄
                </motion.button>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className={`upload-zone ${dragOver.orden ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
            onDrop={(e) => handleDrop(e, 'orden')}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, 'orden')}
            onDragLeave={(e) => handleDragLeave(e, 'orden')}
            onClick={() => !disabled && ordenFileInputRef.current?.click()}
          >
            {uploading.orden ? (
              <div className="uploading">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="upload-spinner"
                />
                <span>Subiendo...</span>
              </div>
            ) : (
              <div className="upload-prompt">
                <span className="upload-icon">📤</span>
                <span className="upload-text">Subir Orden PDF</span>
                <span className="upload-hint">Solo PDF, max 10MB</span>
              </div>
            )}
          </div>
        )}

        <input
          ref={ordenFileInputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => handleInputChange(e, 'orden')}
          style={{ display: 'none' }}
          disabled={disabled}
        />
      </div>

      {/* Remisión Escaneada */}
      <div className="adjunto-section">
        <div className="adjunto-label">
          <span>🖼️ Remisión</span>
          {hasRemision && <span className="adjunto-status success">✓</span>}
        </div>
        
        {hasRemision ? (
          <div className="adjunto-uploaded">
            <div className="file-info">
              <span className="filename">{getFilenameFromUrl(hasRemision)}</span>
              <div className="file-actions">
                <a 
                  href={hasRemision} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-view-file"
                  title="Ver archivo"
                >
                  👁️
                </a>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => remisionFileInputRef.current?.click()}
                  className="btn-replace-file"
                  disabled={disabled || uploading.remision}
                  title="Reemplazar archivo"
                >
                  🔄
                </motion.button>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className={`upload-zone ${dragOver.remision ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
            onDrop={(e) => handleDrop(e, 'remision')}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, 'remision')}
            onDragLeave={(e) => handleDragLeave(e, 'remision')}
            onClick={() => !disabled && remisionFileInputRef.current?.click()}
          >
            {uploading.remision ? (
              <div className="uploading">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="upload-spinner"
                />
                <span>Subiendo...</span>
              </div>
            ) : (
              <div className="upload-prompt">
                <span className="upload-icon">📤</span>
                <span className="upload-text">Subir Remisión</span>
                <span className="upload-hint">PDF, JPG, PNG, max 10MB</span>
              </div>
            )}
          </div>
        )}

        <input
          ref={remisionFileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) => handleInputChange(e, 'remision')}
          style={{ display: 'none' }}
          disabled={disabled}
        />
      </div>

      {disabled && (
        <div className="disabled-overlay">
          <span>💾 Guarde la remisión primero</span>
        </div>
      )}
    </div>
  );
};

export default AdjuntosUploader;