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
import type { Empleado, EmpleadoFormData, EmpleadosFilters } from '../types';

class EmpleadosService extends ApiClient {
  private readonly COLLECTION_NAME = 'empleados';

  async getEmpleados(filters?: EmpleadosFilters): Promise<Empleado[]> {
    const empleadosRef = collection(db, this.COLLECTION_NAME);
    let empleadosQuery = query(empleadosRef, orderBy('creadoEn', 'desc'));

    // Aplicar filtros si existen
    if (filters?.tipo) {
      empleadosQuery = query(empleadosQuery, where('tipo', '==', filters.tipo));
    }
    
    if (filters?.estado) {
      empleadosQuery = query(empleadosQuery, where('estado', '==', filters.estado));
    }

    const snapshot = await getDocs(empleadosQuery);
    
    let empleados = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      creadoEn: doc.data().creadoEn?.toDate() || new Date(),
      actualizadoEn: doc.data().actualizadoEn?.toDate() || new Date(),
    })) as Empleado[];

    // Filtro de búsqueda por texto (se hace en cliente por limitaciones de Firestore)
    if (filters?.busqueda) {
      const searchTerm = filters.busqueda.toLowerCase();
      empleados = empleados.filter(empleado => 
        empleado.nombre.toLowerCase().includes(searchTerm) ||
        empleado.apellido.toLowerCase().includes(searchTerm) ||
        empleado.cedula.includes(searchTerm) ||
        empleado.email.toLowerCase().includes(searchTerm)
      );
    }

    return empleados;
  }

  async createEmpleado(data: EmpleadoFormData, userId: string): Promise<void> {
    const empleadoId = `emp_${Date.now()}`;
    const empleadoRef = doc(db, this.COLLECTION_NAME, empleadoId);

    const empleadoData = {
      ...data,
      id: empleadoId,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
      creadoPor: userId,
    };

    await setDoc(empleadoRef, empleadoData);
  }

  async updateEmpleado(id: string, data: Partial<EmpleadoFormData>): Promise<void> {
    const empleadoRef = doc(db, this.COLLECTION_NAME, id);
    
    const updateData = {
      ...data,
      actualizadoEn: serverTimestamp(),
    };

    await updateDoc(empleadoRef, updateData);
  }

  async deleteEmpleado(id: string): Promise<void> {
    const empleadoRef = doc(db, this.COLLECTION_NAME, id);
    await deleteDoc(empleadoRef);
  }

  async getEmpleadoById(id: string): Promise<Empleado | null> {
    const empleados = await this.getEmpleados();
    return empleados.find(emp => emp.id === id) || null;
  }

  // Métodos de utilidad
  validateEmpleadoData(data: EmpleadoFormData): string[] {
    const errors: string[] = [];

    if (!data.nombre?.trim()) {
      errors.push('El nombre es requerido');
    }

    if (!data.apellido?.trim()) {
      errors.push('El apellido es requerido');
    }

    if (!data.cedula?.trim()) {
      errors.push('La cédula es requerida');
    } else if (data.cedula.length < 7) {
      errors.push('La cédula debe tener al menos 7 caracteres');
    }

    if (!data.email?.trim()) {
      errors.push('El email es requerido');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('El email no tiene un formato válido');
    }

    if (!data.telefono?.trim()) {
      errors.push('El teléfono es requerido');
    }

    if (!data.cargo?.trim()) {
      errors.push('El cargo es requerido');
    }

    if (data.salario && data.salario < 0) {
      errors.push('El salario no puede ser negativo');
    }

    return errors;
  }
}

export const empleadosService = new EmpleadosService();
export default empleadosService;