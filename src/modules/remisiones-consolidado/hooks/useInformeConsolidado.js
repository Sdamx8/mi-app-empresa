/**
 * 🔥 HOOK INFORME CONSOLIDADO - Gestión específica de informes técnicos
 * ===================================================================
 * Hook complementario para funciones avanzadas de informes técnicos
 * como generación de PDF, validaciones y gestión de versiones
 * 
 * @author: Global Mobility Solutions
 * @version: 1.0.0
 * @date: September 2025
 */

import { useState, useCallback } from 'react';
import { 
  collection, 
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '../../../core/config/firebaseConfig';
import { generateInformePDF } from '../lib/pdfMerge';

export const useInformeConsolidado = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate PDF for informe técnico
  const generateInformePDF = useCallback(async (remisionId, informeId) => {
    setLoading(true);
    setError(null);

    try {
      // Get informe data
      const informeRef = doc(db, 'remisiones', remisionId, 'informesTecnicos', informeId);
      const informeSnap = await getDoc(informeRef);
      
      if (!informeSnap.exists()) {
        throw new Error('Informe no encontrado');
      }

      const informeData = informeSnap.data();

      // Get remision data
      const remisionRef = doc(db, 'remisiones', remisionId);
      const remisionSnap = await getDoc(remisionRef);
      
      if (!remisionSnap.exists()) {
        throw new Error('Remisión no encontrada');
      }

      const remisionData = remisionSnap.data();

      // Generate PDF (this function should be implemented in pdfMerge.js)
      const pdfBlob = await generateInformePDF({
        informeData,
        remisionData
      });

      // Upload PDF to Storage
      const fileName = `informe_${remisionData.remision}_${Date.now()}.pdf`;
      const storagePath = `remisiones/${remisionId}/informes/${fileName}`;
      const storageRef = ref(storage, storagePath);

      const snapshot = await uploadBytes(storageRef, pdfBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update informe document with PDF URL
      await updateDoc(informeRef, {
        pdf_generado: downloadURL,
        pdf_generado_en: serverTimestamp(),
        estado_informe: 'pdf_generado'
      });

      return downloadURL;

    } catch (err) {
      console.error('Error generating informe PDF:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Validate informe data
  const validateInformeData = useCallback((informeData) => {
    const errors = [];

    if (!informeData.descripcion_trabajos?.trim()) {
      errors.push('Descripción de trabajos es requerida');
    }

    if (!informeData.fotos_antes || informeData.fotos_antes.length === 0) {
      errors.push('Al menos una foto de antes es requerida');
    }

    if (!informeData.fotos_despues || informeData.fotos_despues.length === 0) {
      errors.push('Al menos una foto de después es requerida');
    }

    if (informeData.descripcion_trabajos && informeData.descripcion_trabajos.length < 10) {
      errors.push('La descripción debe tener al menos 10 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Get all informes for a remision
  const getAllInformesForRemision = useCallback(async (remisionId) => {
    try {
      const informesRef = collection(db, 'remisiones', remisionId, 'informesTecnicos');
      const q = query(informesRef, orderBy('creado_en', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error('Error getting informes:', err);
      throw err;
    }
  }, []);

  // Get latest informe for remision
  const getLatestInforme = useCallback(async (remisionId) => {
    try {
      const informesRef = collection(db, 'remisiones', remisionId, 'informesTecnicos');
      const q = query(informesRef, orderBy('creado_en', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      
      return null;
    } catch (err) {
      console.error('Error getting latest informe:', err);
      throw err;
    }
  }, []);

  // Update informe status
  const updateInformeStatus = useCallback(async (remisionId, informeId, newStatus) => {
    try {
      const informeRef = doc(db, 'remisiones', remisionId, 'informesTecnicos', informeId);
      await updateDoc(informeRef, {
        estado_informe: newStatus,
        actualizado_en: serverTimestamp()
      });

      // Also update the main remision document
      const remisionRef = doc(db, 'remisiones', remisionId);
      await updateDoc(remisionRef, {
        informe_status: newStatus,
        updated_at: serverTimestamp()
      });

    } catch (err) {
      console.error('Error updating informe status:', err);
      throw err;
    }
  }, []);

  // Create new informe técnico
  const createInformeTecnico = useCallback(async (remisionId, informeData, createdBy) => {
    setLoading(true);
    setError(null);

    try {
      if (!remisionId || !informeData) {
        throw new Error('Datos insuficientes para crear el informe');
      }

      // Upload photos first
      const uploadedFotosAntes = [];
      const uploadedFotosDespues = [];

      // Upload fotos antes
      if (informeData.fotos_antes?.length > 0) {
        for (let i = 0; i < informeData.fotos_antes.length; i++) {
          const file = informeData.fotos_antes[i];
          const fileName = `${Date.now()}_antes_${i}_${file.name}`;
          const photoRef = ref(storage, `informes/${remisionId}/${fileName}`);
          
          await uploadBytes(photoRef, file);
          const downloadURL = await getDownloadURL(photoRef);
          
          uploadedFotosAntes.push({
            url: downloadURL,
            filename: fileName,
            upload_date: new Date()
          });
        }
      }

      // Upload fotos después
      if (informeData.fotos_despues?.length > 0) {
        for (let i = 0; i < informeData.fotos_despues.length; i++) {
          const file = informeData.fotos_despues[i];
          const fileName = `${Date.now()}_despues_${i}_${file.name}`;
          const photoRef = ref(storage, `informes/${remisionId}/${fileName}`);
          
          await uploadBytes(photoRef, file);
          const downloadURL = await getDownloadURL(photoRef);
          
          uploadedFotosDespues.push({
            url: downloadURL,
            filename: fileName,
            upload_date: new Date()
          });
        }
      }

      // Create informe document data
      const informeDocData = {
        descripcion_trabajos: informeData.descripcion_trabajos || '',
        observaciones: informeData.observaciones || '',
        fotos_antes: uploadedFotosAntes,
        fotos_despues: uploadedFotosDespues,
        creado_en: serverTimestamp(),
        creado_por: createdBy || 'Sistema',
        actualizado_en: serverTimestamp(),
        version: 1,
        estado: 'activo'
      };

      // Add as subcollection to the remision
      const informeRef = collection(db, 'remisiones', remisionId, 'informesTecnicos');
      const informeDoc = await addDoc(informeRef, informeDocData);

      return informeDoc.id;
    } catch (err) {
      console.error('Error creating informe técnico:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate informe statistics
  const getInformeStats = useCallback((informeData) => {
    if (!informeData) return null;

    return {
      total_fotos_antes: informeData.fotos_antes?.length || 0,
      total_fotos_despues: informeData.fotos_despues?.length || 0,
      total_fotos: (informeData.fotos_antes?.length || 0) + (informeData.fotos_despues?.length || 0),
      descripcion_length: informeData.descripcion_trabajos?.length || 0,
      observaciones_length: informeData.observaciones?.length || 0,
      tiene_pdf: !!informeData.pdf_generado,
      fecha_creacion: informeData.creado_en?.toDate?.() || null,
      creado_por: informeData.creado_por || 'Desconocido'
    };
  }, []);

  return {
    createInformeTecnico,
    generateInformePDF,
    validateInformeData,
    getAllInformesForRemision,
    getLatestInforme,
    updateInformeStatus,
    getInformeStats,
    loading,
    error
  };
};