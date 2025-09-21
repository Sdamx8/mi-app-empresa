/**
 * 🔥 HOOK REMISIONES CONSOLIDADO - Gestión de remisiones con adjuntos e informes
 * ===========================================================================
 * Hook personalizado para manejar remisiones consolidadas con Firebase Storage
 * y Firestore para adjuntos, informes técnicos y PDFs consolidados
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
  setDoc,
  updateDoc,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../../../core/config/firebaseConfig';

export const useRemisionesConsolidado = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Save remision with consolidado structure
  const saveRemisionConsolidado = useCallback(async (rows, userEmail) => {
    setLoading(true);
    setError(null);
    
    try {
      const savedRemisiones = [];
      
      for (const row of rows) {
        // Validate required fields
        if (!row.remision || !row.movil || !row.servicio1 || !row.fecha_remision) {
          throw new Error(`Fila inválida: faltan campos obligatorios (remisión: ${row.remision || 'N/A'})`);
        }

        // Prepare remision data - remove React-only fields
        const { id, firestoreId, ...cleanRow } = row;
        const remisionData = {
          ...cleanRow,
          
          // Convert dates to Firestore timestamps
          fecha_remision: row.fecha_remision instanceof Date ? 
            Timestamp.fromDate(row.fecha_remision) : 
            Timestamp.fromDate(new Date(row.fecha_remision)),
          fecha_maximo: row.fecha_maximo instanceof Date ? 
            Timestamp.fromDate(row.fecha_maximo) : 
            Timestamp.fromDate(new Date(row.fecha_maximo)),
          fecha_bit_prof: row.fecha_bit_prof instanceof Date ? 
            Timestamp.fromDate(row.fecha_bit_prof) : 
            Timestamp.fromDate(new Date(row.fecha_bit_prof)),
          radicacion: row.radicacion instanceof Date ? 
            Timestamp.fromDate(row.radicacion) : 
            Timestamp.fromDate(new Date(row.radicacion)),
          
          // Add metadata
          created_by: userEmail,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          
          // Initialize consolidado fields if not present
          adjuntos: row.adjuntos || {
            orden_url: null,
            remision_url: null
          },
          informe_status: row.informe_status || 'pendiente',
          consolidado_url: row.consolidado_url || null,
          consolidado_creado_en: row.consolidado_creado_en || null,
          consolidado_creado_por: row.consolidado_creado_por || null,
          consolidado_versiones: row.consolidado_versiones || []
        };

        let docRef;
        
        if (row.firestoreId) {
          // Update existing document
          docRef = doc(db, 'remisiones', row.firestoreId);
          await updateDoc(docRef, {
            ...remisionData,
            updated_at: serverTimestamp()
          });
          savedRemisiones.push({ id: row.firestoreId, ...remisionData });
        } else {
          // Create new document
          docRef = await addDoc(collection(db, 'remisiones'), remisionData);
          savedRemisiones.push({ id: docRef.id, ...remisionData });
        }
      }

      return savedRemisiones;
    } catch (err) {
      console.error('Error saving remisiones consolidado:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload adjuntos (orden PDF y remisión escaneada)
  const uploadAdjuntos = useCallback(async (remisionId, files) => {
    setLoading(true);
    setError(null);

    try {
      const urls = {};
      
      for (const [type, file] of Object.entries(files)) {
        if (!file) continue;

        // Define storage path
        const fileName = type === 'orden' ? 'orden.pdf' : 'remision.pdf';
        const storagePath = `remisiones/${remisionId}/adjuntos/${fileName}`;
        const storageRef = ref(storage, storagePath);

        // Upload file
        console.log(`Uploading ${type} to ${storagePath}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        urls[`${type}_url`] = downloadURL;
        console.log(`${type} uploaded successfully:`, downloadURL);
      }

      // Update Firestore document with URLs
      if (Object.keys(urls).length > 0) {
        const docRef = doc(db, 'remisiones', remisionId);
        await updateDoc(docRef, {
          [`adjuntos`]: {
            orden_url: urls.orden_url || null,
            remision_url: urls.remision_url || null
          },
          updated_at: serverTimestamp()
        });
      }

      return urls;
    } catch (err) {
      console.error('Error uploading adjuntos:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if remision exists
  const checkRemisionExists = useCallback(async (remisionNumber) => {
    try {
      const q = query(
        collection(db, 'remisiones'),
        where('remision', '==', remisionNumber)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (err) {
      console.error('Error checking remision existence:', err);
      return false;
    }
  }, []);

  // Get remision by ID
  const getRemisionById = useCallback(async (remisionId) => {
    try {
      const docRef = doc(db, 'remisiones', remisionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.error('Error getting remision:', err);
      throw err;
    }
  }, []);

  return {
    saveRemisionConsolidado,
    uploadAdjuntos,
    checkRemisionExists,
    getRemisionById,
    loading,
    error
  };
};

// Hook para gestión de informes técnicos
export const useInformeConsolidado = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create technical report with photos
  const createInformeTecnico = useCallback(async (remisionId, informeData, userEmail) => {
    setLoading(true);
    setError(null);

    try {
      // Upload photos first
      const fotosAntesUrls = [];
      const fotosDespuesUrls = [];

      // Upload fotos antes
      for (let i = 0; i < informeData.fotos_antes.length; i++) {
        const file = informeData.fotos_antes[i];
        const fileName = `antes_${i + 1}_${Date.now()}.jpg`;
        const storagePath = `remisiones/${remisionId}/fotos/antes/${fileName}`;
        const storageRef = ref(storage, storagePath);

        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        fotosAntesUrls.push({
          url: downloadURL,
          nombre: fileName,
          subido_en: new Date()
        });
      }

      // Upload fotos después
      for (let i = 0; i < informeData.fotos_despues.length; i++) {
        const file = informeData.fotos_despues[i];
        const fileName = `despues_${i + 1}_${Date.now()}.jpg`;
        const storagePath = `remisiones/${remisionId}/fotos/despues/${fileName}`;
        const storageRef = ref(storage, storagePath);

        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        fotosDespuesUrls.push({
          url: downloadURL,
          nombre: fileName,
          subido_en: new Date()
        });
      }

      // Create informe document in subcollection
      const informeDocData = {
        descripcion_trabajos: informeData.descripcion_trabajos,
        observaciones: informeData.observaciones || '',
        fotos_antes: fotosAntesUrls,
        fotos_despues: fotosDespuesUrls,
        pdf_generado: null, // Will be filled when PDF is generated
        creado_por: userEmail,
        creado_en: serverTimestamp(),
        estado_informe: 'creado',
        // Metadata from remision
        remision_numero: informeData.remision_numero,
        movil: informeData.movil,
        no_orden: informeData.no_orden
      };

      // Add to subcollection
      const informeRef = await addDoc(
        collection(db, 'remisiones', remisionId, 'informesTecnicos'),
        informeDocData
      );

      // Update main remision document
      const remisionRef = doc(db, 'remisiones', remisionId);
      await updateDoc(remisionRef, {
        informe_status: 'creado',
        ultimo_informe_id: informeRef.id,
        updated_at: serverTimestamp()
      });

      console.log('Informe técnico creado:', informeRef.id);
      return informeRef.id;

    } catch (err) {
      console.error('Error creating informe técnico:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get informe by remision ID
  const getInformeByRemisionId = useCallback(async (remisionId) => {
    try {
      const informesRef = collection(db, 'remisiones', remisionId, 'informesTecnicos');
      const querySnapshot = await getDocs(informesRef);
      
      if (!querySnapshot.empty) {
        // Return the most recent informe
        const informes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by creation date and return the most recent
        informes.sort((a, b) => {
          const aDate = a.creado_en?.toDate() || new Date(0);
          const bDate = b.creado_en?.toDate() || new Date(0);
          return bDate - aDate;
        });
        
        return informes[0];
      }
      
      return null;
    } catch (err) {
      console.error('Error getting informe:', err);
      throw err;
    }
  }, []);

  return {
    createInformeTecnico,
    getInformeByRemisionId,
    loading,
    error
  };
};