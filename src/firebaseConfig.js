// firebaseConfig.js - Copia simple para evitar imports relativos
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCnyqtyRy0vHoyUnv4fpQVD5VDZ4W3UyE4',
  authDomain: 'global-flow-db.firebaseapp.com',
  projectId: 'global-flow-db',
  storageBucket: 'global-flow-db.firebasestorage.app',
  messagingSenderId: '232714971434',
  appId: '1:232714971434:web:25650510cebd7fb8b39653',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };