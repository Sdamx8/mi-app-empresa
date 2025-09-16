// VistaPrevia.jsx - Preview del informe antes de guardar
import React, { useState } from 'react';
import { guardarInforme } from '../../services/informesService';
import { descargarPDFInforme } from '../../services/pdfService';
import './VistaPrevia.css';

const VistaPrevia = ({ 
  remisionData, 
  datosFormulario, 
  imagenes, 
  empleadoData, 
  onInformeGuardado,
  onVolver 
}) => {
  const [guardando, setGuardando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [error, setError] = useState('');

  const formatearFecha = (fecha) => {
    if (!fecha) return new Date().toLocaleDateString('es-CO');
    
    try {
      if (fecha.toDate) {
        return fecha.toDate().toLocaleDateString('es-CO');
      } else if (fecha instanceof Date) {
        return fecha.toLocaleDateString('es-CO');
      } else {
        return fecha.toString();
      }
    } catch (error) {
      return new Date().toLocaleDateString('es-CO');
    }
  };

  const formatearMoneda = (valor) => {
    if (!valor) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const generarIdInforme = () => {
    const timestamp = Date.now();
    return `INF-${remisionData.remision}-${timestamp}`;
  };

  const handleDescargarPDF = async () => {
    try {
      setGenerandoPDF(true);
      setError('');
      
      console.log('📄 Generando PDF del informe...');
      
      // Preparar datos consolidados para el PDF
      const datosConsolidados = {
        descripciones: datosFormulario.descripcionGeneral ? [datosFormulario.descripcionGeneral] : [],
        materiales: datosFormulario.materialesUtilizados ? 
          datosFormulario.materialesUtilizados.split(',').map(m => m.trim()) : [],
        recursos: datosFormulario.recursosHumanos ? 
          datosFormulario.recursosHumanos.split(',').map(r => r.trim()) : [],
        tiempoTotal: {
          horas: parseInt(datosFormulario.tiempoEjecucion) || 0,
          minutos: ((parseFloat(datosFormulario.tiempoEjecucion) % 1) * 60) || 0
        }
      };

      // Preparar objeto informe completo para PDF
      const informeParaPDF = {
        idInforme: generarIdInforme(),
        numeroRemision: remisionData.remision,
        fechaRemision: formatearFecha(remisionData.fecha_remision),
        movil: remisionData.movil || '',
        autorizo: remisionData.autorizo || '',
        tecnico: datosFormulario.tecnicoAsignado || '',
        estado: 'completado',
        tituloTrabajo: datosFormulario.tituloTrabajo || '',
        datosConsolidados,
        imagenesAntes: imagenes.imagenesAntes || [],
        imagenesDespues: imagenes.imagenesDespues || [],
        elaboradoPor: empleadoData?.contacto?.correo || 'usuario@empresa.com',
        observacionesTecnicas: datosFormulario.observaciones || '',
        creadoEn: { seconds: Date.now() / 1000 },
        remisionEncontrada: remisionData
      };

      await descargarPDFInforme(informeParaPDF);
      console.log('✅ PDF generado y descargado exitosamente');
      
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
      setError('Error al generar el PDF. Intente nuevamente.');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const handleGuardarInforme = async () => {
    try {
      setGuardando(true);
      setError('');
      
      console.log('💾 Iniciando guardado del informe...');

      // Preparar datos consolidados
      const datosConsolidados = {
        descripciones: datosFormulario.descripcionGeneral ? [datosFormulario.descripcionGeneral] : [],
        materiales: datosFormulario.materialesUtilizados ? 
          datosFormulario.materialesUtilizados.split(',').map(m => m.trim()) : [],
        recursos: datosFormulario.recursosHumanos ? 
          datosFormulario.recursosHumanos.split(',').map(r => r.trim()) : [],
        tiempoTotal: {
          horas: parseInt(datosFormulario.tiempoEjecucion) || 0,
          minutos: ((parseFloat(datosFormulario.tiempoEjecucion) % 1) * 60) || 0,
          totalMinutos: (parseFloat(datosFormulario.tiempoEjecucion) * 60) || 0
        }
      };

      // Preparar documento completo
      const documentoInforme = {
        numeroRemision: remisionData.remision,
        fechaRemision: formatearFecha(remisionData.fecha_remision),
        movil: remisionData.movil || '',
        autorizo: remisionData.autorizo || '',
        tecnico: datosFormulario.tecnicoAsignado || '',
        tituloTrabajo: datosFormulario.tituloTrabajo || '',
        datosConsolidados,
        imagenesAntes: imagenes.imagenesAntes || [],
        imagenesDespues: imagenes.imagenesDespues || [],
        elaboradoPor: empleadoData?.contacto?.correo || 'usuario@empresa.com',
        observaciones: datosFormulario.observaciones || '',
        recomendaciones: datosFormulario.recomendaciones || '',
        remisionEncontrada: remisionData
      };

      const resultado = await guardarInforme(documentoInforme);
      
      if (resultado.success) {
        console.log('✅ Informe guardado exitosamente:', resultado);
        onInformeGuardado(resultado);
      } else {
        throw new Error(resultado.error);
      }
      
    } catch (error) {
      console.error('❌ Error guardando informe:', error);
      setError(error.message || 'Error desconocido al guardar el informe');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="vista-previa">
      <div className="vista-header">
        <h2>👁️ Vista Previa del Informe</h2>
        <p>Revisa toda la información antes de guardar el informe técnico</p>
      </div>

      {/* Encabezado del informe */}
      <div className="informe-encabezado">
        <div className="empresa-info">
          <h3>📋 INFORME TÉCNICO</h3>
          <div className="empresa-datos">
            <strong>Global Mobility Solutions</strong><br />
            INNOVACIÓN • EFICIENCIA • EXCELENCIA
          </div>
        </div>
        
        <div className="informe-meta">
          <div className="meta-item">
            <label>ID Informe:</label>
            <span>{generarIdInforme()}</span>
          </div>
          <div className="meta-item">
            <label>Fecha de Generación:</label>
            <span>{new Date().toLocaleDateString('es-CO')}</span>
          </div>
        </div>
      </div>

      {/* Información de la remisión */}
      <div className="seccion-informe">
        <h4>🔍 Información de la Remisión</h4>
        <div className="info-grid">
          <div className="info-row">
            <label>Número de Remisión:</label>
            <span className="valor-destacado">{remisionData.remision}</span>
          </div>
          <div className="info-row">
            <label>Fecha de Remisión:</label>
            <span>{formatearFecha(remisionData.fecha_remision)}</span>
          </div>
          <div className="info-row">
            <label>Móvil:</label>
            <span>{remisionData.movil || 'No especificado'}</span>
          </div>
          <div className="info-row">
            <label>Carrocería:</label>
            <span>{remisionData.carroceria || 'No especificada'}</span>
          </div>
          <div className="info-row">
            <label>Autorizó:</label>
            <span>{remisionData.autorizo || 'No especificado'}</span>
          </div>
          <div className="info-row">
            <label>No. Orden:</label>
            <span>{remisionData.no_orden || 'No especificada'}</span>
          </div>
        </div>
      </div>

      {/* Detalles del trabajo */}
      <div className="seccion-informe">
        <h4>🛠️ Detalles del Trabajo</h4>
        <div className="trabajo-detalles">
          <div className="detalle-row">
            <label>Título del Trabajo:</label>
            <div className="valor-texto">{datosFormulario.tituloTrabajo || 'No especificado'}</div>
          </div>
          <div className="detalle-row">
            <label>Técnico Responsable:</label>
            <div className="valor-texto">{datosFormulario.tecnicoAsignado || 'No asignado'}</div>
          </div>
          <div className="detalle-row">
            <label>Tiempo de Ejecución:</label>
            <div className="valor-texto">{datosFormulario.tiempoEjecucion || '0'} horas</div>
          </div>
        </div>
      </div>

      {/* Descripción de actividades */}
      {datosFormulario.descripcionGeneral && (
        <div className="seccion-informe">
          <h4>📝 Descripción de Actividades</h4>
          <div className="texto-contenido">
            {datosFormulario.descripcionGeneral}
          </div>
        </div>
      )}

      {/* Materiales utilizados */}
      {datosFormulario.materialesUtilizados && (
        <div className="seccion-informe">
          <h4>🔧 Materiales y Suministros</h4>
          <div className="texto-contenido">
            {datosFormulario.materialesUtilizados}
          </div>
        </div>
      )}

      {/* Recursos humanos */}
      {datosFormulario.recursosHumanos && (
        <div className="seccion-informe">
          <h4>👥 Recursos Humanos</h4>
          <div className="texto-contenido">
            {datosFormulario.recursosHumanos}
          </div>
        </div>
      )}

      {/* Observaciones */}
      {datosFormulario.observaciones && (
        <div className="seccion-informe">
          <h4>👁️ Observaciones</h4>
          <div className="texto-contenido">
            {datosFormulario.observaciones}
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {datosFormulario.recomendaciones && (
        <div className="seccion-informe">
          <h4>💡 Recomendaciones</h4>
          <div className="texto-contenido">
            {datosFormulario.recomendaciones}
          </div>
        </div>
      )}

      {/* Imágenes */}
      <div className="seccion-informe">
        <h4>📸 Registro Fotográfico</h4>
        
        {/* Imágenes ANTES */}
        {imagenes.imagenesAntes && imagenes.imagenesAntes.length > 0 && (
          <div className="imagenes-grupo">
            <h5>📷 Imágenes ANTES del Trabajo ({imagenes.imagenesAntes.length})</h5>
            <div className="grid-imagenes-preview">
              {imagenes.imagenesAntes.map((imagen, index) => (
                <div key={index} className="imagen-preview-item">
                  <img src={imagen.url} alt={`Antes ${index + 1}`} />
                  <span className="imagen-titulo">{imagen.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Imágenes DESPUÉS */}
        {imagenes.imagenesDespues && imagenes.imagenesDespues.length > 0 && (
          <div className="imagenes-grupo">
            <h5>📸 Imágenes DESPUÉS del Trabajo ({imagenes.imagenesDespues.length})</h5>
            <div className="grid-imagenes-preview">
              {imagenes.imagenesDespues.map((imagen, index) => (
                <div key={index} className="imagen-preview-item">
                  <img src={imagen.url} alt={`Después ${index + 1}`} />
                  <span className="imagen-titulo">{imagen.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!imagenes.imagenesAntes || imagenes.imagenesAntes.length === 0) && 
         (!imagenes.imagenesDespues || imagenes.imagenesDespues.length === 0) && (
          <div className="sin-imagenes">
            📷 No se han cargado imágenes para este informe
          </div>
        )}
      </div>

      {/* Información financiera */}
      <div className="seccion-informe">
        <h4>💰 Información Financiera</h4>
        <div className="financiero-preview">
          <div className="financiero-item">
            <label>Subtotal:</label>
            <span>{formatearMoneda(remisionData.subtotal)}</span>
          </div>
          <div className="financiero-item total-item">
            <label>Total:</label>
            <span>{formatearMoneda(remisionData.total)}</span>
          </div>
        </div>
      </div>

      {/* Pie del informe */}
      <div className="informe-pie">
        <div className="firma-info">
          <div>
            <strong>Elaborado por:</strong><br />
            {empleadoData?.nombre_completo || 'Usuario Sistema'}<br />
            {empleadoData?.contacto?.correo || 'correo@empresa.com'}
          </div>
          <div>
            <strong>Fecha y Hora:</strong><br />
            {new Date().toLocaleString('es-CO')}
          </div>
        </div>
      </div>

      {/* Error de guardado */}
      {error && (
        <div className="error-guardado">
          ❌ {error}
        </div>
      )}

      {/* Acciones */}
      <div className="acciones-preview">
        <button 
          onClick={onVolver} 
          disabled={guardando || generandoPDF}
          className="btn-volver"
        >
          ← Volver a Editar
        </button>
        <button 
          onClick={handleDescargarPDF}
          disabled={generandoPDF || guardando}
          className="btn-pdf"
        >
          {generandoPDF ? '⏳ Generando PDF...' : '📄 Descargar PDF'}
        </button>
        <button 
          onClick={handleGuardarInforme} 
          disabled={guardando || generandoPDF}
          className="btn-guardar"
        >
          {guardando ? '⏳ Guardando...' : '💾 Guardar Informe'}
        </button>
      </div>
    </div>
  );
};

export default VistaPrevia;