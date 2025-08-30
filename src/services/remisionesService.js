/* 
🚀 GLOBAL MOBILITY SOLUTIONS - SERVICIO REMISIONES
==================================================
Servicio para consultar datos de la colección remisiones
Para autocompletado de informes técnicos
*/

import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

class RemisionesService {
  constructor() {
    this.collectionName = 'remisiones';
  }

  /**
   * Buscar remisión por número (usando el mismo método que BuscarHistorialOptimizado)
   */
  async buscarPorNumero(numeroRemision) {
    try {
      console.log('🔍 Buscando remisión:', numeroRemision);
      
      // Método 1: Búsqueda exacta
      const qExacta = query(
        collection(db, this.collectionName),
        where('remision', '==', numeroRemision.toString()),
        limit(1)
      );

      let querySnapshot = await getDocs(qExacta);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const remision = {
          id: doc.id,
          ...doc.data()
        };
        
        console.log('✅ Remisión encontrada (búsqueda exacta):', remision);
        return remision;
      }
      
      // Método 2: Búsqueda con filtro en cliente (igual que useSearch.js)
      console.log('🔄 Búsqueda exacta sin resultados, intentando búsqueda con filtro...');
      
      const qTodos = query(collection(db, this.collectionName), limit(1000));
      querySnapshot = await getDocs(qTodos);
      
      const numerosBusqueda = numeroRemision.toString().toLowerCase();
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const remisionDoc = data.remision ? data.remision.toString().toLowerCase() : '';
        
        if (remisionDoc === numerosBusqueda || remisionDoc.includes(numerosBusqueda)) {
          const remision = {
            id: doc.id,
            ...data
          };
          
          console.log('✅ Remisión encontrada (búsqueda con filtro):', remision);
          return remision;
        }
      }
      
      console.log('❌ Remisión no encontrada');
      return null;
    } catch (error) {
      console.error('❌ Error al buscar remisión:', error);
      throw new Error('Error al buscar la remisión');
    }
  }

  /**
   * Obtener todas las remisiones (para autocompletado)
   */
  async obtenerRemisiones(limite = 100) {
    try {
      console.log('📋 Obteniendo lista de remisiones...');
      
      const q = query(
        collection(db, this.collectionName),
        orderBy('remision', 'desc'),
        limit(limite)
      );

      const querySnapshot = await getDocs(q);
      const remisiones = [];

      querySnapshot.forEach((doc) => {
        remisiones.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ ${remisiones.length} remisiones obtenidas`);
      return remisiones;
    } catch (error) {
      console.error('❌ Error al obtener remisiones:', error);
      throw new Error('Error al cargar las remisiones');
    }
  }

  /**
   * Buscar remisiones por criterios múltiples
   */
  async buscarRemisiones(criterios = {}) {
    try {
      console.log('🔍 Buscando remisiones con criterios:', criterios);
      
      let q = collection(db, this.collectionName);

      // Aplicar filtros según criterios
      if (criterios.tecnico) {
        q = query(q, where('tecnico', '==', criterios.tecnico));
      }

      if (criterios.movil) {
        q = query(q, where('movil', '==', criterios.movil));
      }

      if (criterios.autorizo) {
        q = query(q, where('autorizo', '==', criterios.autorizo));
      }

      // Ordenar y limitar
      q = query(q, orderBy('remision', 'desc'), limit(50));

      const querySnapshot = await getDocs(q);
      const remisiones = [];

      querySnapshot.forEach((doc) => {
        remisiones.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ ${remisiones.length} remisiones encontradas`);
      return remisiones;
    } catch (error) {
      console.error('❌ Error al buscar remisiones:', error);
      throw new Error('Error al buscar remisiones');
    }
  }

  /**
   * Obtener técnicos únicos de las remisiones
   */
  async obtenerTecnicos() {
    try {
      console.log('👷‍♂️ Obteniendo lista de técnicos...');
      
      const remisiones = await this.obtenerRemisiones(200);
      const tecnicos = [...new Set(
        remisiones
          .map(r => r.tecnico)
          .filter(t => t && t.trim())
      )].sort();

      console.log(`✅ ${tecnicos.length} técnicos únicos encontrados`);
      return tecnicos;
    } catch (error) {
      console.error('❌ Error al obtener técnicos:', error);
      throw new Error('Error al cargar la lista de técnicos');
    }
  }

  /**
   * Obtener móviles únicos de las remisiones
   */
  async obtenerMoviles() {
    try {
      console.log('🚛 Obteniendo lista de móviles...');
      
      const remisiones = await this.obtenerRemisiones(200);
      const moviles = [...new Set(
        remisiones
          .map(r => r.movil)
          .filter(m => m && m.trim())
      )].sort();

      console.log(`✅ ${moviles.length} móviles únicos encontrados`);
      return moviles;
    } catch (error) {
      console.error('❌ Error al obtener móviles:', error);
      throw new Error('Error al cargar la lista de móviles');
    }
  }

  /**
   * Validar si existe una remisión
   */
  async existeRemision(numeroRemision) {
    try {
      const remision = await this.buscarPorNumero(numeroRemision);
      return !!remision;
    } catch (error) {
      console.error('❌ Error al validar remisión:', error);
      return false;
    }
  }

  /**
   * Obtener estadísticas de remisiones
   */
  async obtenerEstadisticas() {
    try {
      console.log('📊 Obteniendo estadísticas de remisiones...');
      
      const remisiones = await this.obtenerRemisiones(500);
      
      const estadisticas = {
        total: remisiones.length,
        tecnicos: new Set(remisiones.map(r => r.tecnico).filter(t => t)).size,
        moviles: new Set(remisiones.map(r => r.movil).filter(m => m)).size,
        totalValor: remisiones.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0),
        ultimaRemision: remisiones[0]?.remision || 'N/A'
      };

      console.log('✅ Estadísticas obtenidas:', estadisticas);
      return estadisticas;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw new Error('Error al calcular estadísticas de remisiones');
    }
  }

  /**
   * Formatear datos de remisión para informe técnico
   */
  formatearParaInforme(remision) {
    if (!remision) return null;

    return {
      movil: this.procesarMovil(remision.movil),
      descripcion: remision.descripcion || '',
      tecnico: remision.tecnico || '',
      fechaRemision: this.formatearFecha(remision.fecha_remision),
      autorizo: remision.autorizo || '',
      une: remision.une || '',
      subtotal: parseFloat(remision.subtotal) || 0,
      total: parseFloat(remision.total) || 0
    };
  }

  /**
   * Procesar número de móvil según reglas de negocio
   */
  procesarMovil(movil) {
    if (!movil) return '';
    
    // Si ya tiene prefijo Z70- o BO-, mantenerlo
    if (movil.startsWith('Z70-') || movil.startsWith('BO-')) {
      // Omitir los que tienen prefijo BO-
      return movil.startsWith('BO-') ? '' : movil;
    }
    
    // Agregar prefijo Z70-
    return `Z70-${movil}`;
  }

  /**
   * Formatear fecha para mejor presentación
   */
  formatearFecha(fecha) {
    if (!fecha) return '';
    
    try {
      // Si es un timestamp de Firestore
      if (fecha.toDate) {
        return fecha.toDate().toLocaleDateString('es-CO');
      }
      
      // Si es una fecha string
      if (typeof fecha === 'string') {
        const date = new Date(fecha);
        return isNaN(date.getTime()) ? fecha : date.toLocaleDateString('es-CO');
      }
      
      // Si es un objeto Date
      if (fecha instanceof Date) {
        return fecha.toLocaleDateString('es-CO');
      }
      
      return fecha.toString();
    } catch (error) {
      console.warn('⚠️ Error al formatear fecha:', error);
      return fecha.toString();
    }
  }
}

// Exportar instancia única
export const remisionesService = new RemisionesService();
