// services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyCnyqtyRy0vHoyUnv4fpQVD5VDZ4W3UyE4',
  authDomain: 'global-flow-db.firebaseapp.com',
  projectId: 'global-flow-db',
  storageBucket: 'global-flow-db.firebasestorage.app',
  messagingSenderId: '232714971434',
  appId: '1:232714971434:web:25650510cebd7fb8b39653',
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
