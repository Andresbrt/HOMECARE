/**
 * Firebase Configuration
 * Proyecto: homecare-1582c
 *
 * SETUP REQUERIDO:
 * 1. Ve a https://console.firebase.google.com/ → Proyecto homecare-1582c
 * 2. Configuración del proyecto (⚙️) → Tus apps → Web App
 * 3. Si no hay una web app, crea una (ícono </>) y copia el firebaseConfig
 * 4. Reemplaza los valores en app.json > extra > firebase*
 */

import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey,
  authDomain: extra.firebaseAuthDomain || 'homecare-1582c.firebaseapp.com',
  projectId: extra.firebaseProjectId || 'homecare-1582c',
  storageBucket: extra.firebaseStorageBucket || 'homecare-1582c.appspot.com',
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId: extra.firebaseAppId,
};

// Evitar inicializar múltiples veces (hot-reload)
let app;
let auth;
let db;
let storage;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  app = getApps()[0];
  // Al hacer hot-reload, importar las instancias ya creadas
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
