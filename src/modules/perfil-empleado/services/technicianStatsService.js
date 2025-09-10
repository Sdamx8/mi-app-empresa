import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../../core/config/firebaseConfig';

// Función para normalizar nombres de técnicos (misma lógica que ReporteHistorial)
function normalizarNombreTecnico(nombre) {
  if (!nombre) return '';
  
  let nombreLimpio = nombre.toString().toUpperCase().trim();
  
  nombreLimpio = nombreLimpio
    .replace(/\s*[-–—]\s*/g, ' - ')
    .replace(/\s*[yY&]\s*/g, ' Y ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return nombreLimpio;
}

// Función para verificar si un técnico coincide con un nombre de búsqueda
function coincideTecnico(nombreBD, nombreBusqueda) {
  if (!nombreBD || !nombreBusqueda) return false;
  
  const nombreBDNormalizado = normalizarNombreTecnico(nombreBD);
  const nombreBusquedaNormalizado = normalizarNombreTecnico(nombreBusqueda);
  
  if (nombreBDNormalizado === nombreBusquedaNormalizado) return true;
  if (nombreBDNormalizado.includes(nombreBusquedaNormalizado)) return true;
  
  const partesBusqueda = nombreBusquedaNormalizado.split(/[\s\-Y&]+/).filter(p => p.length > 0);
  const partesBD = nombreBDNormalizado.split(/[\s\-Y&]+/).filter(p => p.length > 0);
  
  return partesBusqueda.some(parteBusqueda => 
    parteBusqueda.length > 2 && 
    partesBD.some(parteBD => 
      parteBD.includes(parteBusqueda) || parteBusqueda.includes(parteBD)
    )
  );
}

// Función para convertir fechas
function parseFecha(fechaStr) {
  if (!fechaStr) return null;

  if (typeof fechaStr === 'object' && fechaStr.seconds) {
    return new Date(fechaStr.seconds * 1000);
  }

  if (typeof fechaStr === 'string') {
    const delimitador = fechaStr.includes('/') ? '/' : '-';
    const partes = fechaStr.split(delimitador);

    if (partes.length !== 3) return null;

    let dd, mm, yyyy;

    if (delimitador === '/') {
      [dd, mm, yyyy] = partes;
    } else {
      [yyyy, mm, dd] = partes;
    }

    const fechaISO = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    const fecha = new Date(fechaISO);

    if (isNaN(fecha.getTime())) {
      return null;
    }

    return fecha;
  }

  return null;
}

// Servicio principal para obtener estadísticas de trabajos del técnico
export const getTechnicianStats = async (nombreTecnico) => {
  try {
    if (!nombreTecnico) {
      return {
        trabajosDelMes: 0,
        totalDelMes: 0,
        promedioSemanal: 0,
        ultimoTrabajo: null,
        error: null
      };
    }

    // Verificar autenticación
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    // Consultar remisiones (sin filtro inicial, luego filtraremos por técnico)
    const remisionesRef = collection(db, 'remisiones');
    const snapshot = await getDocs(remisionesRef);
    
    // Filtrar trabajos del técnico y del usuario (por correo en elaboradoPor si existe)
    let trabajosTecnico = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(doc => {
        // Filtrar por técnico Y por el usuario actual si el documento tiene elaboradoPor
        const esTecnicoValido = coincideTecnico(doc.tecnico, nombreTecnico);
        const esDelUsuario = !doc.elaboradoPor || doc.elaboradoPor === currentUser.email;
        return esTecnicoValido && esDelUsuario;
      });

    // Procesar fechas
    trabajosTecnico = trabajosTecnico.map(doc => {
      const fecha = parseFecha(doc.fecha_remision);
      return { ...doc, fechaObj: fecha };
    }).filter(doc => doc.fechaObj); // Solo los que tienen fecha válida

    // Obtener fecha actual y primer día del mes
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Filtrar trabajos del mes actual
    const trabajosDelMes = trabajosTecnico.filter(doc => 
      doc.fechaObj >= primerDiaMes && doc.fechaObj <= hoy
    );

    // Calcular totales del mes
    const totalDelMes = trabajosDelMes.reduce((sum, doc) => {
      let valor = doc.total ?? 0;
      if (typeof valor === 'string') {
        valor = valor.replace(/[^\d.]/g, '');
      }
      return sum + parseFloat(valor || 0);
    }, 0);

    // Calcular promedio semanal del mes
    const diasDelMes = Math.ceil((hoy - primerDiaMes) / (24 * 60 * 60 * 1000));
    const semanasDelMes = Math.max(1, diasDelMes / 7);
    const promedioSemanal = totalDelMes / semanasDelMes;

    // Encontrar último trabajo
    const ultimoTrabajo = trabajosTecnico
      .sort((a, b) => b.fechaObj - a.fechaObj)[0] || null;

    // Estadísticas adicionales
    const trabajosTotales = trabajosTecnico.length;
    const totalAcumulado = trabajosTecnico.reduce((sum, doc) => {
      let valor = doc.total ?? 0;
      if (typeof valor === 'string') {
        valor = valor.replace(/[^\d.]/g, '');
      }
      return sum + parseFloat(valor || 0);
    }, 0);

    return {
      trabajosDelMes: trabajosDelMes.length,
      totalDelMes,
      promedioSemanal,
      ultimoTrabajo: ultimoTrabajo ? {
        fecha: ultimoTrabajo.fechaObj.toLocaleDateString(),
        remision: ultimoTrabajo.remision,
        total: ultimoTrabajo.total
      } : null,
      trabajosTotales,
      totalAcumulado,
      error: null
    };

  } catch (error) {
    console.error('Error al obtener estadísticas del técnico:', error);
    return {
      trabajosDelMes: 0,
      totalDelMes: 0,
      promedioSemanal: 0,
      ultimoTrabajo: null,
      trabajosTotales: 0,
      totalAcumulado: 0,
      error: 'Error al cargar las estadísticas'
    };
  }
};

// Función para obtener el resumen de trabajo del mes con detalles por día
export const getMonthlyWorkSummary = async (nombreTecnico) => {
  try {
    // Verificar autenticación
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    // Consultar remisiones
    const remisionesRef = collection(db, 'remisiones');
    const snapshot = await getDocs(remisionesRef);
    
    // Filtrar trabajos del técnico y del usuario
    let trabajosTecnico = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(doc => {
        const esTecnicoValido = coincideTecnico(doc.tecnico, nombreTecnico);
        const esDelUsuario = !doc.elaboradoPor || doc.elaboradoPor === currentUser.email;
        return esTecnicoValido && esDelUsuario;
      });

    // Procesar fechas
    trabajosTecnico = trabajosTecnico.map(doc => {
      const fecha = parseFecha(doc.fecha_remision);
      return { ...doc, fechaObj: fecha };
    }).filter(doc => doc.fechaObj);

    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    const trabajosDelMes = trabajosTecnico.filter(doc => 
      doc.fechaObj >= primerDiaMes && doc.fechaObj <= hoy
    );

    // Agrupar por día
    const trabajosPorDia = {};
    trabajosDelMes.forEach(doc => {
      const dia = doc.fechaObj.toLocaleDateString();
      if (!trabajosPorDia[dia]) {
        trabajosPorDia[dia] = { cantidad: 0, total: 0, trabajos: [] };
      }
      
      let valor = doc.total ?? 0;
      if (typeof valor === 'string') {
        valor = valor.replace(/[^\d.]/g, '');
      }
      valor = parseFloat(valor || 0);
      
      trabajosPorDia[dia].cantidad++;
      trabajosPorDia[dia].total += valor;
      trabajosPorDia[dia].trabajos.push({
        remision: doc.remision,
        total: valor
      });
    });

    return {
      trabajosPorDia,
      totalTrabajos: trabajosDelMes.length,
      totalMonto: trabajosDelMes.reduce((sum, doc) => {
        let valor = doc.total ?? 0;
        if (typeof valor === 'string') {
          valor = valor.replace(/[^\d.]/g, '');
        }
        return sum + parseFloat(valor || 0);
      }, 0),
      error: null
    };

  } catch (error) {
    console.error('Error al obtener resumen mensual:', error);
    return {
      trabajosPorDia: {},
      totalTrabajos: 0,
      totalMonto: 0,
      error: 'Error al cargar el resumen mensual'
    };
  }
};
