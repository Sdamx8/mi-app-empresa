/**
 * INFORMES TÉCNICOS SERVICE
 * Servicio único para manejo de toda la lógica Firebase del módulo de informes técnicos
 * 
 * Características:
 * - Sin imports relativos fuera de src/
 * - Manejo robusto de errores
 * - Logging detallado para debugging
 * - APIs simples y claras
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage, auth } from '../core/config/firebaseConfig.js';

class InformesService {
  constructor() {
    this.COLLECTIONS = {
      REMISIONES: 'remisiones',
      SERVICIOS: 'servicios', 
      EMPLEADOS: 'EMPLEADOS',
      INFORMES_TECNICOS: 'informesTecnicos'
    };
  }

  /**
   * Buscar remisión por número
   */
  async buscarRemision(numeroRemision) {
    try {
      console.log(`🔍 Buscando remisión: ${numeroRemision}`);
      
      const remisionesRef = collection(db, this.COLLECTIONS.REMISIONES);
      const q = query(remisionesRef, where('remision', '==', numeroRemision));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`❌ Remisión ${numeroRemision} no encontrada`);
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const remisionData = { id: doc.id, ...doc.data() };
      
      console.log(`✅ Remisión encontrada:`, remisionData);
      return remisionData;
      
    } catch (error) {
      console.error('❌ Error buscando remisión:', error);
      throw new Error(`Error al buscar la remisión: ${error.message}`);
    }
  }

  /**
   * Buscar información de servicios por títulos
   */
  async buscarServicios(titulosServicios) {
    try {
      console.log(`🔍 Buscando servicios para títulos:`, titulosServicios);
      
      if (!titulosServicios || titulosServicios.length === 0) {
        return [];
      }
      
      const serviciosRef = collection(db, this.COLLECTIONS.SERVICIOS);
      const serviciosData = [];
      
      // Buscar cada servicio por título
      for (const titulo of titulosServicios) {
        if (titulo && titulo.trim()) {
          const q = query(serviciosRef, where('título', '==', titulo.trim()));
          const querySnapshot = await getDocs(q);
          
          querySnapshot.forEach(doc => {
            serviciosData.push({ id: doc.id, ...doc.data() });
          });
        }
      }
      
      console.log(`✅ Servicios encontrados (${serviciosData.length}):`, serviciosData);
      return serviciosData;
      
    } catch (error) {
      console.error('❌ Error buscando servicios:', error);
      throw new Error(`Error al buscar servicios: ${error.message}`);
    }
  }

  /**
   * Validar permisos de usuario
   */
  async validarPermisos(email) {
    try {
      console.log(`🔍 Validando permisos para: ${email}`);
      
      if (!email) {
        throw new Error('Email requerido para validación');
      }
      
      const empleadosRef = collection(db, this.COLLECTIONS.EMPLEADOS);
      const q = query(empleadosRef, where('contacto.correo', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`❌ Usuario ${email} no encontrado en empleados`);
        return { esValido: false, motivo: 'Usuario no encontrado' };
      }
      
      const empleadoData = querySnapshot.docs[0].data();
      const tipoEmpleado = empleadoData.tipo_empleado;
      
      const tiposPermitidos = ['directivo', 'administrativo'];
      const esValido = tiposPermitidos.includes(tipoEmpleado);
      
      console.log(`✅ Validación completada - Usuario: ${esValido ? 'Autorizado' : 'No autorizado'} (${tipoEmpleado})`);
      
      return {
        esValido,
        tipoEmpleado,
        empleado: empleadoData,
        motivo: esValido ? 'Autorizado' : `Tipo de empleado '${tipoEmpleado}' no tiene permisos`
      };
      
    } catch (error) {
      console.error('❌ Error validando permisos:', error);
      throw new Error(`Error validando permisos: ${error.message}`);
    }
  }

  /**
   * Subir imagen a Firebase Storage
   */
  async subirImagen(archivo, numeroRemision, tipo) {
    try {
      console.log(`📤 Subiendo imagen: ${archivo.name} (${tipo})`);
      
      if (!archivo) {
        throw new Error('Archivo requerido');
      }
      
      // Validar tipo de archivo
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!tiposPermitidos.includes(archivo.type)) {
        throw new Error('Tipo de archivo no permitido. Solo JPG, JPEG y PNG.');
      }
      
      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024;
      if (archivo.size > maxSize) {
        throw new Error('Archivo muy grande. Máximo 5MB.');
      }
      
      // Crear ruta de almacenamiento: informes/{numeroRemision}_{tipo}_{timestamp}_{nombreOriginal}
      const timestamp = Date.now();
      const nombreArchivo = `${numeroRemision}_${tipo}_${timestamp}_${archivo.name}`;
      const rutaStorage = `informes/${nombreArchivo}`;
      
      // Subir archivo
      const storageRef = ref(storage, rutaStorage);
      const snapshot = await uploadBytes(storageRef, archivo);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const resultado = {
        name: archivo.name,
        url: downloadURL,
        storageRef: rutaStorage,
        size: archivo.size,
        type: archivo.type
      };
      
      console.log(`✅ Imagen subida exitosamente:`, resultado);
      return resultado;
      
    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      throw new Error(`Error subiendo imagen: ${error.message}`);
    }
  }

  /**
   * Consolidar datos de servicios
   */
  consolidarDatosServicios(servicios) {
    try {
      console.log(`🔄 Consolidando datos de ${servicios.length} servicios`);
      
      const consolidado = {
        descripciones: [],
        materiales: [],
        recursos: [],
        tiempoTotal: { horas: 0, minutos: 0 }
      };
      
      servicios.forEach(servicio => {
        // Descripciones
        if (servicio.descripcion_actividad) {
          consolidado.descripciones.push(servicio.descripcion_actividad);
        }
        
        // Materiales 
        if (servicio.materiales_suministrados) {
          const materiales = servicio.materiales_suministrados
            .split(',')
            .map(m => m.trim())
            .filter(m => m);
          consolidado.materiales.push(...materiales);
        }
        
        // Recursos humanos
        if (servicio.recurso_humano_requerido) {
          consolidado.recursos.push(servicio.recurso_humano_requerido);
        }
        
        // Tiempo (asumiendo que tiempo_estimado está en horas)
        if (servicio.tiempo_estimado) {
          consolidado.tiempoTotal.horas += parseInt(servicio.tiempo_estimado) || 0;
        }
      });
      
      // Remover duplicados
      consolidado.materiales = [...new Set(consolidado.materiales)];
      consolidado.recursos = [...new Set(consolidado.recursos)];
      
      console.log(`✅ Datos consolidados:`, consolidado);
      return consolidado;
      
    } catch (error) {
      console.error('❌ Error consolidando datos:', error);
      throw new Error(`Error consolidando datos: ${error.message}`);
    }
  }

  /**
   * Guardar informe técnico
   */
  async guardarInforme(datosInforme) {
    try {
      console.log(`💾 Guardando informe técnico:`, datosInforme);
      
      // Validar datos requeridos
      const camposRequeridos = ['numeroRemision', 'tecnico', 'tituloTrabajo'];
      for (const campo of camposRequeridos) {
        if (!datosInforme[campo]) {
          throw new Error(`Campo requerido faltante: ${campo}`);
        }
      }
      
      // Crear ID del informe
      const timestamp = Date.now();
      const idInforme = `INF-${datosInforme.numeroRemision}-${timestamp}`;
      
      // Preparar documento
      const documento = {
        idInforme,
        numeroRemision: datosInforme.numeroRemision,
        fechaRemision: datosInforme.fechaRemision || '',
        movil: datosInforme.movil || '',
        autorizo: datosInforme.autorizo || '',
        tecnico: datosInforme.tecnico,
        estado: 'completado',
        tituloTrabajo: datosInforme.tituloTrabajo,
        datosConsolidados: datosInforme.datosConsolidados || {},
        imagenesAntes: datosInforme.imagenesAntes || [],
        imagenesDespues: datosInforme.imagenesDespues || [],
        elaboradoPor: auth.currentUser?.email || 'sistema',
        creadoEn: Timestamp.now()
      };
      
      // Guardar en Firestore
      const informesRef = collection(db, this.COLLECTIONS.INFORMES_TECNICOS);
      const docRef = await addDoc(informesRef, documento);
      
      console.log(`✅ Informe guardado con ID: ${docRef.id}`);
      return { 
        id: docRef.id, 
        idInforme,
        ...documento 
      };
      
    } catch (error) {
      console.error('❌ Error guardando informe:', error);
      throw new Error(`Error guardando informe: ${error.message}`);
    }
  }

  /**
   * Obtener lista de informes técnicos
   */
  async obtenerInformes() {
    try {
      console.log('🔍 Obteniendo lista de informes técnicos');
      
      const informesRef = collection(db, this.COLLECTIONS.INFORMES_TECNICOS);
      const q = query(informesRef, orderBy('creadoEn', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const informes = [];
      querySnapshot.forEach(doc => {
        informes.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`✅ Informes obtenidos: ${informes.length}`);
      return informes;
      
    } catch (error) {
      console.error('❌ Error obteniendo informes:', error);
      throw new Error(`Error obteniendo informes: ${error.message}`);
    }
  }

  /**
   * Eliminar imagen de Storage
   */
  async eliminarImagen(storageRef) {
    try {
      console.log(`🗑️ Eliminando imagen: ${storageRef}`);
      
      const imageRef = ref(storage, storageRef);
      await deleteObject(imageRef);
      
      console.log(`✅ Imagen eliminada exitosamente`);
      
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
      // No lanzar error para no bloquear otras operaciones
    }
  }
}

// Instancia única del servicio
export const informesService = new InformesService();