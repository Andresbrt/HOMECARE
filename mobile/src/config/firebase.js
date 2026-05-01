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
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey,
  authDomain: extra.firebaseAuthDomain || 'homecare-1582c.firebaseapp.com',
  projectId: extra.firebaseProjectId || 'homecare-1582c',
  storageBucket: extra.firebaseStorageBucket || 'homecare-1582c.appspot.com',
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId: extra.firebaseAppId,
};

const firebaseEnabled = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId &&
  firebaseConfig.messagingSenderId
);

if (!firebaseEnabled) {
  console.warn(
    '[Firebase] Configuración incompleta. Agrega firebaseApiKey, firebaseProjectId, firebaseAppId y firebaseMessagingSenderId en app.json > expo.extra.'
  );
}

let app = null;
let auth = null;
let db = null;
let storage = null;

const shouldUseNativePersistence = Platform.OS !== 'web';

const initializeFirebaseAuth = (appInstance) => {
  if (!appInstance) return null;

  if (shouldUseNativePersistence) {
    try {
      return initializeAuth(appInstance, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (error) {
      console.warn('[Firebase] initializeAuth falló, usando getAuth():', error.message);
      return getAuth(appInstance);
    }
  }

  return getAuth(appInstance);
};

if (getApps().length === 0 && firebaseEnabled) {
  app = initializeApp(firebaseConfig);
  auth = initializeFirebaseAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else if (getApps().length > 0) {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage, firebaseEnabled };
