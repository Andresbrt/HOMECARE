/**
 * Firebase Authentication Service
 * Maneja sign-in, sign-up y sign-out usando Firebase Auth
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { GOOGLE_CLIENT_ID } from '../config/api';

// @react-native-google-signin/google-signin requiere módulo nativo (TurboModule).
// En Expo Go no está disponible → cargamos con try/catch para evitar el crash.
// En builds nativos (expo run:android / expo run:ios) funciona normalmente.
let _GoogleSignin = null;
let _isSuccessResponse = null;
let _googleSigninAvailable = false;

try {
  const gModule = require('@react-native-google-signin/google-signin');
  _GoogleSignin = gModule.GoogleSignin;
  _isSuccessResponse = gModule.isSuccessResponse;
  _googleSigninAvailable = true;
} catch (_) {
  console.warn('[GoogleSignIn] Módulo nativo no disponible. Usando Expo Go → Google Sign-In deshabilitado.');
}

/**
 * Registrar nuevo usuario en Firebase Auth
 * @returns {firebase.User} usuario creado
 */
export const firebaseSignUp = async (email, password, displayName) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  return credential.user;
};

/**
 * Iniciar sesión con email y contraseña
 * @returns {firebase.User} usuario autenticado
 */
export const firebaseSignIn = async (email, password) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

/**
 * Obtener el ID token de Firebase para autenticar con el backend
 * @returns {string} Firebase ID token
 */
export const getFirebaseIdToken = async (forceRefresh = false) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay usuario autenticado en Firebase');
  return user.getIdToken(forceRefresh);
};

/**
 * Cerrar sesión en Firebase
 */
export const firebaseSignOut = async () => {
  await signOut(auth);
};

/**
 * Enviar email de recuperación de contraseña
 */
export const firebaseSendPasswordReset = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Obtener usuario actual de Firebase
 */
export const getCurrentFirebaseUser = () => auth.currentUser;

/**
 * Iniciar sesión con Google usando @react-native-google-signin/google-signin
 * Requiere build nativo (expo run:android / expo run:ios) — NO funciona en Expo Go
 * @returns {string} Firebase ID Token para enviar al backend
 */
export const signInWithGoogle = async () => {
  if (!_googleSigninAvailable || !_GoogleSignin) {
    throw new Error(
      'Google Sign-In requiere un build nativo.\n' +
      'Ejecuta: expo run:android  o  expo run:ios'
    );
  }
  _GoogleSignin.configure({
    webClientId: GOOGLE_CLIENT_ID,
    offlineAccess: false,
  });
  await _GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await _GoogleSignin.signIn();
  if (!_isSuccessResponse(response)) {
    throw new Error('Inicio de sesión con Google cancelado');
  }
  const { idToken } = response.data;
  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  return userCredential.user.getIdToken();
};
