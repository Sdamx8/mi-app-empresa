import React, { useState, useEffect } from 'react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../../core/config/firebaseConfig';
import { useAuth } from '../../../core/auth/AuthContext';
import './NoticiasCompensar.css';

const NoticiasCompensar = ({ userRole }) => {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState(null);
  const [imageTitle, setImageTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar noticia actual desde Firestore
  useEffect(() => {
    const fetchNoticia = async () => {
      try {
        const docRef = doc(db, 'noticias', 'bannerActual');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setImageUrl(data.urlImagen);
          setImageTitle(data.titulo || '');
        }
      } catch (error) {
        console.error('Error cargando noticia:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNoticia();
  }, []);

  // Subir nueva imagen (solo admin autorizado)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten archivos JPG, PNG o PDF');
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no puede superar 5MB');
      return;
    }

    try {
      setUploading(true);
      const timestamp = new Date().getTime();
      const fileName = `noticia_${timestamp}_${file.name}`;
      const storageRef = ref(storage, `noticias/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Guardar en Firestore
      await setDoc(doc(db, 'noticias', 'bannerActual'), {
        urlImagen: url,
        titulo: imageTitle || 'Comunicado Corporativo',
        created_at: serverTimestamp(),
        uploadedBy: user.email,
        fileName: fileName
      });

      setImageUrl(url);
      alert('✅ Noticia cargada exitosamente');
      
      // Limpiar input
      e.target.value = '';
    } catch (error) {
      console.error('Error subiendo noticia:', error);
      alert('❌ Error al subir la noticia. Intenta nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  // Verificar si el usuario puede subir noticias
  const canUploadNews = user?.email === 'davian.ayala7@gmail.com' && userRole === 'directivo';

  if (loading) {
    return (
      <div className="noticias-container">
        <div className="noticias-loading">
          <div className="loading-spinner"></div>
          <span>Cargando noticias...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="noticias-container">
      <h3 className="noticias-header">
        📢 Noticias Corporativas
      </h3>

      {/* Imagen/Banner cargado */}
      {imageUrl ? (
        <div className="noticia-content">
          {imageTitle && (
            <h4 className="noticia-title">{imageTitle}</h4>
          )}
          <div className="noticia-image-container">
            {imageUrl.includes('.pdf') ? (
              <div className="pdf-preview">
                <div className="pdf-icon">📄</div>
                <p className="pdf-title">Documento PDF</p>
                <a 
                  href={imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="pdf-link"
                >
                  Abrir PDF
                </a>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={imageTitle || "Noticia Corporativa"}
                className="noticia-image"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="no-noticias">
          <div className="no-noticias-icon">📰</div>
          <p className="no-noticias-text">No hay noticias cargadas</p>
          <p className="no-noticias-subtext">
            Próximamente se mostrarán aquí los comunicados corporativos
          </p>
        </div>
      )}

      {/* Panel de administración - Solo para davian.ayala7@gmail.com con rol directivo */}
      {canUploadNews && (
        <div className="admin-panel">
          <div className="admin-header">
            <div className="admin-icon">👑</div>
            <h4 className="admin-title">
              Panel de Administración - Noticias
            </h4>
          </div>
          
          {/* Input para título opcional */}
          <div className="form-group">
            <label className="form-label">
              Título del comunicado (opcional)
            </label>
            <input
              type="text"
              value={imageTitle}
              onChange={(e) => setImageTitle(e.target.value)}
              placeholder="Ej: Comunicado importante, Nueva política..."
              className="form-input"
            />
          </div>

          {/* Input para subir archivo */}
          <div className="form-group">
            <label className="form-label">
              Subir nueva noticia (JPG, PNG o PDF - máx 5MB)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="file-input"
            />
          </div>

          {uploading && (
            <div className="uploading-indicator">
              <div className="uploading-spinner"></div>
              Cargando noticia...
            </div>
          )}
          
          <p className="admin-note">
            💡 Los cambios serán visibles para todos los empleados inmediatamente
          </p>
        </div>
      )}
    </div>
  );
};

export default NoticiasCompensar;