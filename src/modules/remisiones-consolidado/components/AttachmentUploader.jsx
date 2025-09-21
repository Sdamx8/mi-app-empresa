/**
 * 📎 Enhanced Adjuntos Uploader
 * ============================
 * Sistema completo de gestión de adjuntos con Firebase Storage
 * Incluye orden de trabajo, remisión escaneada e informe técnico
 * 
 * @author: Global Mobility Solutions
 * @version: 2.0.0
 * @date: September 2025
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll 
} from 'firebase/storage';
import { 
  doc, 
  updateDoc, 
  serverTimestamp,
  collection,
  addDoc 
} from 'firebase/firestore';
import { storage, db } from '../../../core/config/firebaseConfig';
import { useAuth } from '../../../core/auth/AuthContext';
import { downloadConsolidatedPDF, validateAttachmentsForConsolidation } from '../lib/pdfConsolidation';
import './AdjuntosUploader.css';

const AttachmentUploader = ({ remisionId, remision, onUpdate = () => {} }) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState({});
  const [files, setFiles] = useState({
    orden_trabajo: null,
    remision_escaneada: null,
    informe_tecnico: null
  });
  const [dragOver, setDragOver] = useState({});
  const [notification, setNotification] = useState(null);

  const ordenInputRef = useRef(null);
  const remisionInputRef = useRef(null);
  const informeInputRef = useRef(null);

  // Cargar archivos existentes al montar el componente
  useEffect(() => {
    if (remision?.adjuntos) {
      setFiles(prev => ({
        ...prev,
        orden_trabajo: remision.adjuntos.orden_trabajo_url ? {
          url: remision.adjuntos.orden_trabajo_url,
          name: remision.adjuntos.orden_trabajo_metadata?.name || 'Orden de Trabajo.pdf',
          type: remision.adjuntos.orden_trabajo_metadata?.type || 'application/pdf'
        } : null,
        remision_escaneada: remision.adjuntos.remision_escaneada_url ? {
          url: remision.adjuntos.remision_escaneada_url,
          name: remision.adjuntos.remision_escaneada_metadata?.name || 'Remisión Escaneada.pdf',
          type: remision.adjuntos.remision_escaneada_metadata?.type || 'application/pdf'
        } : null,
        informe_tecnico: remision.adjuntos.informe_tecnico_url ? {
          url: remision.adjuntos.informe_tecnico_url,
          name: remision.adjuntos.informe_tecnico_metadata?.name || 'Informe Técnico.pdf',
          type: remision.adjuntos.informe_tecnico_metadata?.type || 'application/pdf'
        } : null
      }));
    }
  }, [remision]);

  // Validar archivos
  const validateFile = (file, type) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
      throw new Error('El archivo no debe superar los 10MB');
    }

    switch (type) {
      case 'orden_trabajo':
        if (file.type !== 'application/pdf') {
          throw new Error('La orden de trabajo debe ser un archivo PDF');
        }
        break;
      
      case 'remision_escaneada':
        const allowedRemisionTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/webp'
        ];
        if (!allowedRemisionTypes.includes(file.type)) {
          throw new Error('La remisión escaneada debe ser PDF, JPG, PNG o WEBP');
        }
        break;
        
      case 'informe_tecnico':
        const allowedInformeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp'
        ];
        if (!allowedInformeTypes.includes(file.type)) {
          throw new Error('El informe técnico debe ser PDF o imagen');
        }
        break;
        
      default:
        throw new Error('Tipo de archivo no válido');
    }
  };

  // Subir archivo a Firebase Storage
  const uploadFileToStorage = async (file, type) => {
    const fileName = `${type}_${Date.now()}_${file.name}`;
    const storagePath = `remisiones/${remisionId}/adjuntos/${fileName}`;
    const storageRef = ref(storage, storagePath);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: storagePath,
      name: file.name,
      type: file.type,
      size: file.size,
      uploaded_at: new Date(),
      uploaded_by: user?.email || 'Usuario desconocido'
    };
  };

  // Manejar subida de archivos
  const handleFileUpload = async (file, type) => {
    try {
      setUploading(prev => ({ ...prev, [type]: true }));
      
      // Validar archivo
      validateFile(file, type);
      
      // Subir a Storage
      const fileData = await uploadFileToStorage(file, type);
      
      // Actualizar estado local
      setFiles(prev => ({
        ...prev,
        [type]: fileData
      }));
      
      // Actualizar Firestore
      const updateData = {
        [`adjuntos.${type}_url`]: fileData.url,
        [`adjuntos.${type}_metadata`]: {
          name: fileData.name,
          type: fileData.type,
          size: fileData.size,
          uploaded_at: serverTimestamp(),
          uploaded_by: user?.email || 'Usuario desconocido'
        },
        updated_at: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'remisiones', remisionId), updateData);
      
      // Registrar en historial
      await addDoc(collection(db, 'historial_remisiones'), {
        remision_id: remisionId,
        usuario: user?.email || 'Usuario desconocido',
        accion: 'Adjunto subido',
        detalles: `${type.replace('_', ' ')} subido: ${fileData.name}`,
        fecha: serverTimestamp()
      });
      
      showNotification(`${type.replace('_', ' ')} subido correctamente`, 'success');
      onUpdate();
      
    } catch (error) {
      console.error('Error uploading file:', error);
      showNotification(error.message, 'error');
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  // Eliminar archivo
  const handleFileDelete = async (type) => {
    try {
      setUploading(prev => ({ ...prev, [type]: true }));
      
      // Eliminar de Storage si existe la ruta
      const currentFile = files[type];
      if (currentFile?.path) {
        const storageRef = ref(storage, currentFile.path);
        try {
          await deleteObject(storageRef);
        } catch (storageError) {
          console.warn('Error deleting from storage:', storageError);
        }
      }
      
      // Actualizar Firestore
      const updateData = {
        [`adjuntos.${type}_url`]: null,
        [`adjuntos.${type}_metadata`]: null,
        updated_at: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'remisiones', remisionId), updateData);
      
      // Actualizar estado local
      setFiles(prev => ({
        ...prev,
        [type]: null
      }));
      
      // Registrar en historial
      await addDoc(collection(db, 'historial_remisiones'), {
        remision_id: remisionId,
        usuario: user?.email || 'Usuario desconocido',
        accion: 'Adjunto eliminado',
        detalles: `${type.replace('_', ' ')} eliminado`,
        fecha: serverTimestamp()
      });
      
      showNotification(`${type.replace('_', ' ')} eliminado`, 'success');
      onUpdate();
      
    } catch (error) {
      console.error('Error deleting file:', error);
      showNotification('Error al eliminar archivo: ' + error.message, 'error');
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  // Manejar selección de archivos
  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file, type);
    }
    // Limpiar input
    e.target.value = '';
  };

  // Manejar drag & drop
  const handleDragOver = useCallback((e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: true }));
  }, []);

  const handleDragLeave = useCallback((e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
  }, []);

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile, type);
    }
  }, []);

  // Mostrar notificación
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Generar PDF consolidado
  const handleGenerateConsolidated = async () => {
    try {
      setUploading(prev => ({ ...prev, consolidating: true }));

      const validation = validateAttachmentsForConsolidation(files);
      
      if (!validation.canConsolidate) {
        showNotification('No hay archivos disponibles para consolidar', 'warning');
        return;
      }

      showNotification('Generando PDF consolidado...', 'info');

      const result = await downloadConsolidatedPDF(files, remision);

      if (result.success) {
        showNotification(`PDF consolidado descargado: ${result.fileName}`, 'success');
        
        // Registrar en historial
        await addDoc(collection(db, 'historial_remisiones'), {
          remision_id: remisionId,
          usuario: user?.email || 'Usuario desconocido',
          accion: 'PDF consolidado',
          detalles: `PDF consolidado generado con ${result.pageCount} páginas: ${result.fileName}`,
          fecha: serverTimestamp()
        });
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Error generating consolidated PDF:', error);
      showNotification('Error al generar PDF consolidado: ' + error.message, 'error');
    } finally {
      setUploading(prev => ({ ...prev, consolidating: false }));
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Renderizar área de subida
  const renderUploadArea = (type, title, description, inputRef) => {
    const isUploading = uploading[type];
    const isDragOver = dragOver[type];
    const hasFile = files[type];

    return (
      <div className="upload-section">
        <h4>{title}</h4>
        <p className="upload-description">{description}</p>
        
        {hasFile ? (
          // Archivo ya subido
          <div className="file-uploaded">
            <div className="file-info">
              <div className="file-icon">
                {hasFile.type?.includes('pdf') ? '📄' : '🖼️'}
              </div>
              <div className="file-details">
                <span className="file-name">{hasFile.name}</span>
                {hasFile.size && (
                  <span className="file-size">{formatFileSize(hasFile.size)}</span>
                )}
              </div>
            </div>
            
            <div className="file-actions">
              {hasFile.url && (
                <a
                  href={hasFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-view"
                  title="Ver archivo"
                >
                  👁️
                </a>
              )}
              <button
                onClick={() => handleFileDelete(type)}
                disabled={isUploading}
                className="btn-delete"
                title="Eliminar archivo"
              >
                🗑️
              </button>
            </div>
          </div>
        ) : (
          // Área de subida
          <div
            className={`upload-area ${isDragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
            onDragOver={(e) => handleDragOver(e, type)}
            onDragLeave={(e) => handleDragLeave(e, type)}
            onDrop={(e) => handleDrop(e, type)}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <div className="uploading-indicator">
                <div className="spinner"></div>
                <span>Subiendo archivo...</span>
              </div>
            ) : (
              <div className="upload-content">
                <div className="upload-icon">📎</div>
                <p>Haz clic aquí o arrastra un archivo</p>
                <span className="upload-hint">
                  {type === 'orden_trabajo' ? 'Solo PDF hasta 10MB' :
                   type === 'remision_escaneada' ? 'PDF, JPG, PNG, WEBP hasta 10MB' :
                   'PDF o imágenes hasta 10MB'}
                </span>
              </div>
            )}
          </div>
        )}
        
        <input
          ref={inputRef}
          type="file"
          onChange={(e) => handleFileSelect(e, type)}
          accept={type === 'orden_trabajo' ? '.pdf' : 
                  type === 'remision_escaneada' ? '.pdf,.jpg,.jpeg,.png,.webp' :
                  '.pdf,.jpg,.jpeg,.png,.webp'}
          style={{ display: 'none' }}
          disabled={isUploading}
        />
      </div>
    );
  };

  return (
    <div className="adjuntos-uploader">
      {/* Notificación */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="upload-sections">
        {renderUploadArea(
          'orden_trabajo',
          '1. Orden de Trabajo (PDF)',
          'Archivo PDF de la orden de trabajo oficial',
          ordenInputRef
        )}
        
        {renderUploadArea(
          'remision_escaneada', 
          '2. Remisión Escaneada',
          'Archivo PDF o imagen de la remisión escaneada',
          remisionInputRef
        )}
        
        {renderUploadArea(
          'informe_tecnico',
          '3. Informe Técnico',
          'Documento PDF o imágenes del informe técnico',
          informeInputRef
        )}
      </div>

      {/* Indicadores de estado */}
      <div className="upload-status">
        <div className="status-item">
          <span className="status-label">Orden:</span>
          <span className={`status-indicator ${files.orden_trabajo ? 'complete' : 'pending'}`}>
            {files.orden_trabajo ? '✅ Subido' : '⏳ Pendiente'}
          </span>
        </div>
        
        <div className="status-item">
          <span className="status-label">Remisión:</span>
          <span className={`status-indicator ${files.remision_escaneada ? 'complete' : 'pending'}`}>
            {files.remision_escaneada ? '✅ Subido' : '⏳ Pendiente'}
          </span>
        </div>
        
        <div className="status-item">
          <span className="status-label">Informe:</span>
          <span className={`status-indicator ${files.informe_tecnico ? 'complete' : 'pending'}`}>
            {files.informe_tecnico ? '✅ Subido' : '⏳ Pendiente'}
          </span>
        </div>
      </div>

      {/* Botón generar consolidado */}
      {(files.orden_trabajo || files.remision_escaneada || files.informe_tecnico) && (
        <div className="consolidado-section">
          <button
            className="btn-consolidado"
            onClick={handleGenerateConsolidated}
            disabled={uploading.consolidating}
          >
            {uploading.consolidating ? (
              <>
                <div className="spinner-sm"></div>
                Generando PDF...
              </>
            ) : (
              <>📄 Generar PDF Consolidado</>
            )}
          </button>
          <p className="consolidado-info">
            Combina todos los archivos en orden: Orden → Remisión → Informe
          </p>
          {(() => {
            const validation = validateAttachmentsForConsolidation(files);
            return (
              <p className="consolidado-status">
                Archivos disponibles: {validation.availableCount} de {validation.totalCount}
              </p>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default AttachmentUploader;