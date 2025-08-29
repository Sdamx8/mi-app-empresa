import React, { useState, useRef } from 'react';
import './MultipleImageUpload.css';

/**
 * Componente para cargar múltiples imágenes con vista previa
 * Soporta hasta 5 imágenes por sección (antes/después)
 */
const MultipleImageUpload = ({ 
  label, 
  images = [], 
  onImagesChange, 
  maxImages = 5,
  disabled = false 
}) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Manejar selección de archivos
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    processFiles(files);
    
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    event.target.value = '';
  };

  // Procesar archivos seleccionados
  const processFiles = (files) => {
    const validFiles = files.filter(file => {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} no es una imagen válida`);
        return false;
      }
      
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} es muy grande. Tamaño máximo: 5MB`);
        return false;
      }
      
      return true;
    });

    // Verificar límite de imágenes
    const totalImages = images.length + validFiles.length;
    if (totalImages > maxImages) {
      alert(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    // Agregar nuevas imágenes
    const newImages = [...images, ...validFiles];
    onImagesChange(newImages);
  };

  // Manejar drag and drop
  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    processFiles(files);
  };

  // Eliminar imagen
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  // Abrir selector de archivos
  const openFileSelector = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="multiple-image-upload">
      <label className="upload-label">{label}</label>
      
      {/* Área de carga */}
      <div 
        className={`upload-area ${dragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            <p>Arrastra imágenes aquí o haz clic para seleccionar</p>
            <p className="upload-subtext">
              Máximo {maxImages} imágenes | Formatos: JPG, PNG, GIF | Tamaño máximo: 5MB
            </p>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="file-input"
          disabled={disabled}
        />
      </div>

      {/* Contador de imágenes */}
      <div className="image-counter">
        <span>{images.length} de {maxImages} imágenes seleccionadas</span>
      </div>

      {/* Vista previa de imágenes */}
      {images.length > 0 && (
        <div className="images-preview">
          <h4>Vista previa:</h4>
          <div className="preview-grid">
            {images.map((image, index) => (
              <div key={index} className="preview-item">
                <div className="preview-image">
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt={`Preview ${index + 1}`}
                    onLoad={() => URL.revokeObjectURL(image)}
                  />
                  <div className="image-overlay">
                    <button 
                      type="button"
                      className="remove-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      disabled={disabled}
                    >
                      ❌
                    </button>
                  </div>
                </div>
                <div className="image-info">
                  <span className="image-name">{image.name}</span>
                  <span className="image-size">
                    {(image.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultipleImageUpload;
