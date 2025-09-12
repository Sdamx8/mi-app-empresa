import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../../core/config/firebase';
import { ApiClient } from '../../../core/api/client';
import type { Remision, RemisionFormData, RemisionesFilters } from '../types';
import { VALIDATION_RULES } from '../constants';

class RemisionesService extends ApiClient {
  private readonly COLLECTION_NAME = 'remisiones';

  async getRemisiones(filters?: RemisionesFilters): Promise<Remision[]> {
    const remisionesRef = collection(db, this.COLLECTION_NAME);
    let remisionesQuery = query(remisionesRef, orderBy('creadoEn', 'desc'));

    // Aplicar filtros si existen
    if (filters?.tipoTrabajo) {
      remisionesQuery = query(remisionesQuery, where('tipoTrabajo', '==', filters.tipoTrabajo));
    }
    
    if (filters?.estado) {
      remisionesQuery = query(remisionesQuery, where('estado', '==', filters.estado));
    }

    if (filters?.tecnico) {
      remisionesQuery = query(remisionesQuery, where('tecnicoResponsable', '==', filters.tecnico));
    }

    const snapshot = await getDocs(remisionesQuery);
    
    let remisiones = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      creadoEn: doc.data().creadoEn?.toDate() || new Date(),
      actualizadoEn: doc.data().actualizadoEn?.toDate() || new Date(),
    })) as Remision[];

    // Filtros adicionales en cliente
    if (filters?.fechaDesde) {
      remisiones = remisiones.filter(remision => 
        remision.fecha >= filters.fechaDesde!
      );
    }

    if (filters?.fechaHasta) {
      remisiones = remisiones.filter(remision => 
        remision.fecha <= filters.fechaHasta!
      );
    }

    if (filters?.cliente) {
      const clienteSearch = filters.cliente.toLowerCase();
      remisiones = remisiones.filter(remision => 
        remision.cliente.toLowerCase().includes(clienteSearch)
      );
    }

    if (filters?.busqueda) {
      const searchTerm = filters.busqueda.toLowerCase();
      remisiones = remisiones.filter(remision => 
        remision.numeroRemision.toLowerCase().includes(searchTerm) ||
        remision.cliente.toLowerCase().includes(searchTerm) ||
        remision.descripcionTrabajo.toLowerCase().includes(searchTerm) ||
        remision.ubicacion.toLowerCase().includes(searchTerm)
      );
    }

    return remisiones;
  }

  async createRemision(data: RemisionFormData, userId: string): Promise<void> {
    const remisionId = `rem_${Date.now()}`;
    const remisionRef = doc(db, this.COLLECTION_NAME, remisionId);

    const remisionData = {
      ...data,
      id: remisionId,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
      creadoPor: userId,
    };

    await setDoc(remisionRef, remisionData);
  }

  async updateRemision(id: string, data: Partial<RemisionFormData>): Promise<void> {
    const remisionRef = doc(db, this.COLLECTION_NAME, id);
    
    const updateData = {
      ...data,
      actualizadoEn: serverTimestamp(),
    };

    await updateDoc(remisionRef, updateData);
  }

  async deleteRemision(id: string): Promise<void> {
    const remisionRef = doc(db, this.COLLECTION_NAME, id);
    await deleteDoc(remisionRef);
  }

  async getRemisionById(id: string): Promise<Remision | null> {
    const remisiones = await this.getRemisiones();
    return remisiones.find(rem => rem.id === id) || null;
  }

  // Generar número de remisión automático
  async generarNumeroRemision(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    // Obtener remisiones del día actual
    const remisionesHoy = await this.getRemisiones({
      fechaDesde: `${year}-${month}-${day}`,
      fechaHasta: `${year}-${month}-${day}`
    });
    
    const secuencial = (remisionesHoy.length + 1).toString().padStart(3, '0');
    
    return `REM-${year}${month}${day}-${secuencial}`;
  }

  // Métodos de validación
  validateRemisionData(data: RemisionFormData): string[] {
    const errors: string[] = [];

    if (!data.numeroRemision?.trim()) {
      errors.push('El número de remisión es requerido');
    } else if (data.numeroRemision.length < VALIDATION_RULES.NUMERO_REMISION_MIN_LENGTH) {
      errors.push(`El número de remisión debe tener al menos ${VALIDATION_RULES.NUMERO_REMISION_MIN_LENGTH} caracteres`);
    }

    if (!data.fecha) {
      errors.push('La fecha es requerida');
    }

    if (!data.cliente?.trim()) {
      errors.push('El cliente es requerido');
    } else if (data.cliente.length < VALIDATION_RULES.CLIENTE_MIN_LENGTH) {
      errors.push(`El cliente debe tener al menos ${VALIDATION_RULES.CLIENTE_MIN_LENGTH} caracteres`);
    }

    if (!data.ubicacion?.trim()) {
      errors.push('La ubicación es requerida');
    }

    if (!data.descripcionTrabajo?.trim()) {
      errors.push('La descripción del trabajo es requerida');
    } else if (data.descripcionTrabajo.length < VALIDATION_RULES.DESCRIPCION_MIN_LENGTH) {
      errors.push(`La descripción debe tener al menos ${VALIDATION_RULES.DESCRIPCION_MIN_LENGTH} caracteres`);
    }

    if (!data.tecnicoResponsable?.trim()) {
      errors.push('El técnico responsable es requerido');
    }

    if (data.tiempoTrabajo && !VALIDATION_RULES.TIEMPO_TRABAJO_PATTERN.test(data.tiempoTrabajo)) {
      errors.push('El formato de tiempo debe ser HH:MM (ej: 02:30)');
    }

    if (data.imagenes && data.imagenes.length > VALIDATION_RULES.MAX_IMAGENES) {
      errors.push(`Máximo ${VALIDATION_RULES.MAX_IMAGENES} imágenes permitidas`);
    }

    return errors;
  }

  // Método para validar archivos
  validateFile(file: File): string | null {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!VALIDATION_RULES.TIPOS_ARCHIVO_PERMITIDOS.includes(extension as any)) {
      return `Tipo de archivo no permitido. Tipos permitidos: ${VALIDATION_RULES.TIPOS_ARCHIVO_PERMITIDOS.join(', ')}`;
    }

    if (file.size > VALIDATION_RULES.MAX_ARCHIVO_SIZE) {
      const maxSizeMB = VALIDATION_RULES.MAX_ARCHIVO_SIZE / (1024 * 1024);
      return `El archivo no debe superar ${maxSizeMB}MB`;
    }

    return null;
  }
}

export const remisionesService = new RemisionesService();
export default remisionesService;