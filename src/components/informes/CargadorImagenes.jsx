// CargadorImagenes.jsx - Componente para subir imágenes antes/después
import React, { useState } from 'react';
import { subirImagen, eliminarImagen } from '../../services/informesService';

const CargadorImagenes = ({ numeroRemision, onImagenesActualizadas }) => {
  const [imagenesAntes, setImagenesAntes] = useState([]);
  const [imagenesDespues, setImagenesDespues] = useState([]);
  const [cargando, setCargando] = useState({});
  const [errores, setErrores] = useState({});

  const MAX_IMAGENES = 10;
  const TIPOS_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const TAMANO_MAX = 10 * 1024 * 1024; // 10MB

  // Notificar cambios al componente padre
  React.useEffect(() => {
    if (onImagenesActualizadas) {
      onImagenesActualizadas({
        imagenesAntes,
        imagenesDespues
      });
    }
  }, [imagenesAntes, imagenesDespues, onImagenesActualizadas]);

  const validarArchivo = (file) => {
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return 'Tipo de archivo no permitido. Use JPG, PNG o WEBP';
    }
    
    if (file.size > TAMANO_MAX) {
      return 'Archivo muy grande. Máximo 10MB permitido';
    }
    
    return null;
  };

  const manejarSeleccionArchivos = async (files, tipo) => {
    const archivosArray = Array.from(files);
    const imagenes = tipo === 'antes' ? imagenesAntes : imagenesDespues;
    
    // Verificar límite
    if (imagenes.length + archivosArray.length > MAX_IMAGENES) {
      setErrores(prev => ({
        ...prev,
        [tipo]: `Máximo ${MAX_IMAGENES} imágenes permitidas`
      }));
      return;
    }

    // Limpiar errores previos
    setErrores(prev => ({
      ...prev,
      [tipo]: ''
    }));

    for (let i = 0; i < archivosArray.length; i++) {
      const file = archivosArray[i];
      const errorValidacion = validarArchivo(file);
      
      if (errorValidacion) {
        setErrores(prev => ({
          ...prev,
          [tipo]: `${file.name}: ${errorValidacion}`
        }));
        continue;
      }

      const loadingKey = `${tipo}_${Date.now()}_${i}`;
      setCargando(prev => ({
        ...prev,
        [loadingKey]: true
      }));

      try {
        console.log(`📤 Subiendo imagen ${tipo}: ${file.name}`);
        const resultado = await subirImagen(file, numeroRemision, tipo);
        
        if (resultado.success) {
          const nuevaImagen = {
            id: loadingKey,
            ...resultado.data
          };

          if (tipo === 'antes') {
            setImagenesAntes(prev => [...prev, nuevaImagen]);
          } else {
            setImagenesDespues(prev => [...prev, nuevaImagen]);
          }
          
          console.log(`✅ Imagen ${tipo} subida exitosamente:`, nuevaImagen);
        } else {
          throw new Error(resultado.error);
        }
        
      } catch (error) {
        console.error(`❌ Error subiendo imagen ${tipo}:`, error);
        setErrores(prev => ({
          ...prev,
          [tipo]: `Error subiendo ${file.name}: ${error.message}`
        }));
      } finally {
        setCargando(prev => {
          const nuevo = { ...prev };
          delete nuevo[loadingKey];
          return nuevo;
        });
      }
    }
  };

  const eliminarImagenLocal = async (imagen, tipo) => {
    try {
      console.log(`🗑️ Eliminando imagen ${tipo}:`, imagen.name);
      
      // Eliminar de Firebase Storage
      if (imagen.storageRef) {
        const resultado = await eliminarImagen(imagen.storageRef);
        if (!resultado.success) {
          throw new Error(resultado.error);
        }
      }
      
      // Eliminar del estado local
      if (tipo === 'antes') {
        setImagenesAntes(prev => prev.filter(img => img.id !== imagen.id));
      } else {
        setImagenesDespues(prev => prev.filter(img => img.id !== imagen.id));
      }
      
      console.log(`✅ Imagen eliminada exitosamente`);
      
    } catch (error) {
      console.error(`❌ Error eliminando imagen:`, error);
      setErrores(prev => ({
        ...prev,
        [tipo]: `Error eliminando imagen: ${error.message}`
      }));
    }
  };

  const formatearTamano = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const SeccionImagenes = ({ tipo, imagenes, titulo, icono }) => (
    <div className="seccion-imagenes">
      <h3>{icono} {titulo}</h3>
      
      {/* Input de carga */}
      <div className="zona-carga">
        <input
          type="file"
          id={`input-${tipo}`}
          multiple
          accept="image/*"
          onChange={(e) => manejarSeleccionArchivos(e.target.files, tipo)}
          style={{ display: 'none' }}
        />
        <label htmlFor={`input-${tipo}`} className="btn-cargar">
          📁 Seleccionar Imágenes {tipo === 'antes' ? 'ANTES' : 'DESPUÉS'}
        </label>
        <p className="info-carga">
          {imagenes.length}/{MAX_IMAGENES} imágenes | JPG, PNG, WEBP | Máx. 10MB
        </p>
      </div>

      {/* Errores */}
      {errores[tipo] && (
        <div className="error-carga">
          ❌ {errores[tipo]}
        </div>
      )}

      {/* Lista de imágenes */}
      <div className="grid-imagenes">
        {imagenes.map((imagen) => (
          <div key={imagen.id} className="imagen-item">
            <div className="imagen-preview">
              <img 
                src={imagen.url} 
                alt={imagen.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="imagen-placeholder" style={{ display: 'none' }}>
                🖼️ Error cargando imagen
              </div>
            </div>
            
            <div className="imagen-info">
              <div className="imagen-nombre" title={imagen.name}>
                {imagen.name.length > 20 
                  ? imagen.name.substring(0, 20) + '...' 
                  : imagen.name}
              </div>
              <div className="imagen-tamano">
                {formatearTamano(imagen.size)}
              </div>
            </div>
            
            <button 
              onClick={() => eliminarImagenLocal(imagen, tipo)}
              className="btn-eliminar"
              title="Eliminar imagen"
            >
              🗑️
            </button>
          </div>
        ))}
        
        {/* Indicadores de carga */}
        {Object.keys(cargando)
          .filter(key => key.startsWith(tipo))
          .map(key => (
            <div key={key} className="imagen-item cargando">
              <div className="imagen-preview">
                <div className="cargando-placeholder">
                  <div className="spinner"></div>
                  <span>Subiendo...</span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="cargador-imagenes">
      <div className="cargador-header">
        <h2>📸 Cargar Imágenes</h2>
        <p>Sube las fotos del antes y después del trabajo realizado</p>
      </div>

      <SeccionImagenes 
        tipo="antes"
        imagenes={imagenesAntes}
        titulo="Imágenes ANTES del Trabajo"
        icono="📷"
      />

      <SeccionImagenes 
        tipo="despues"
        imagenes={imagenesDespues}
        titulo="Imágenes DESPUÉS del Trabajo"
        icono="📸"
      />

      {/* Resumen */}
      <div className="resumen-imagenes">
        <h4>📊 Resumen</h4>
        <div className="resumen-grid">
          <div className="resumen-item">
            <span className="resumen-label">Imágenes ANTES:</span>
            <span className="resumen-valor">{imagenesAntes.length}</span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Imágenes DESPUÉS:</span>
            <span className="resumen-valor">{imagenesDespues.length}</span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Total:</span>
            <span className="resumen-valor total">{imagenesAntes.length + imagenesDespues.length}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cargador-imagenes {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .cargador-header {
          margin-bottom: 24px;
        }

        .cargador-header h2 {
          color: #2c3e50;
          margin: 0 0 8px 0;
          font-size: 1.4rem;
        }

        .cargador-header p {
          color: #7f8c8d;
          margin: 0;
        }

        .seccion-imagenes {
          margin-bottom: 32px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #3498db;
        }

        .seccion-imagenes h3 {
          color: #2c3e50;
          margin: 0 0 16px 0;
          font-size: 1.2rem;
        }

        .zona-carga {
          text-align: center;
          margin-bottom: 16px;
        }

        .btn-cargar {
          display: inline-block;
          background: #3498db;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 500;
        }

        .btn-cargar:hover {
          background: #2980b9;
        }

        .info-carga {
          margin: 8px 0 0 0;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .error-carga {
          background: #fee;
          color: #e74c3c;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          border-left: 4px solid #e74c3c;
        }

        .grid-imagenes {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
        }

        .imagen-item {
          background: white;
          border-radius: 8px;
          padding: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: relative;
          transition: transform 0.2s;
        }

        .imagen-item:hover {
          transform: translateY(-2px);
        }

        .imagen-item.cargando {
          border: 2px dashed #3498db;
        }

        .imagen-preview {
          aspect-ratio: 1;
          border-radius: 6px;
          overflow: hidden;
          background: #ecf0f1;
          margin-bottom: 8px;
          position: relative;
        }

        .imagen-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .imagen-placeholder,
        .cargando-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: #7f8c8d;
          font-size: 0.9rem;
          text-align: center;
          flex-direction: column;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #ecf0f1;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .imagen-info {
          padding: 4px 0;
        }

        .imagen-nombre {
          font-size: 0.8rem;
          font-weight: 500;
          color: #2c3e50;
          margin-bottom: 2px;
        }

        .imagen-tamano {
          font-size: 0.75rem;
          color: #7f8c8d;
        }

        .btn-eliminar {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #e74c3c;
          color: white;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 0.8rem;
          transition: background-color 0.2s;
        }

        .btn-eliminar:hover {
          background: #c0392b;
        }

        .resumen-imagenes {
          background: #e8f6ff;
          padding: 16px;
          border-radius: 6px;
          border-left: 4px solid #3498db;
        }

        .resumen-imagenes h4 {
          margin: 0 0 12px 0;
          color: #2c3e50;
        }

        .resumen-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .resumen-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 12px;
          border-radius: 6px;
        }

        .resumen-label {
          font-weight: 500;
          color: #34495e;
        }

        .resumen-valor {
          background: #3498db;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .resumen-valor.total {
          background: #27ae60;
        }

        @media (max-width: 768px) {
          .cargador-imagenes {
            padding: 16px;
            margin: 0 -8px 20px -8px;
          }

          .grid-imagenes {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 12px;
          }

          .resumen-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default CargadorImagenes;