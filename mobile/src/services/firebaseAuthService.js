/**
 * Firebase Authentication Service
 *
 * ESTRATEGIAS GOOGLE SIGN-IN:
 *   • Expo Go  → expo-auth-session (browser OAuth2). El hook Google.useAuthRequest()
 *                vive en LoginScreen.js y llama signInWithGoogleCredential(accessToken).
 *   • Build nativo → @react-native-google-signin (UX nativo superior).
 *                    Llamado desde signInWithGoogle().
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
import Constants from 'expo-constants';
import { auth } from '../config/firebase';
import { GOOGLE_CLIENT_ID } from '../config/api';

// ─── Detección de entorno ─────────────────────────────────────────────────
export const isExpoGo = () => Constants.appOwnership === 'expo';

// ─── Native Google Sign-In (builds nativos) ───────────────────────────────
// @react-native-google-signin require módulo nativo TurboModule.
// En Expo Go lanzará excepción al cargar → lazy require con try/catch.
let _GoogleSignin       = null;
let _isSuccessResponse  = null;
let _googleNativeReady  = false;

try {
  const gModule       = require('@react-native-google-signin/google-signin');
  _GoogleSignin       = gModule.GoogleSignin;
  _isSuccessResponse  = gModule.isSuccessResponse;
  _googleNativeReady  = true;
} catch (_) {
  // En Expo Go → usaremos expo-auth-session (hook en LoginScreen.js)
}

// ─── Banco de IDs de plataforma (app.json extra) ──────────────────────────
// webClientId  : aplica para Expo Go + web OAuth flow
// iosClientId  : construido invirtiendo el URL scheme de app.json
const IOS_CLIENT_ID = '630129948671-o3pb4j0ng9f6eeln8tevjn1b89bm16da.apps.googleusercontent.com';
export const GOOGLE_IDS = {
  webClientId     : GOOGLE_CLIENT_ID,
  iosClientId     : IOS_CLIENT_ID,
  // androidClientId: añadir cuando tengas el SHA-1 registrado en Firebase Console
};

// ─── 1. Firma con credencial Google (accessToken o idToken) ───────────────
/**
 * Recibe el accessToken (o idToken) proveniente de expo-auth-session
 * y devuelve el Firebase ID Token listo para enviar al backend.
 * Usado en el flujo Expo Go (el hook vive en LoginScreen.js).
 */
export const signInWithGoogleCredential = async (accessToken, idToken = null) => {
  const credential    = GoogleAuthProvider.credential(idToken, accessToken);
  const userCredential = await signInWithCredential(auth, credential);
  return userCredential.user.getIdToken();
};

// ─── 2. Firma nativa (builds nativos) ─────────────────────────────────────
/**
 * Usa @react-native-google-signin para el flow nativo (mejor UX).
 * En Expo Go lanza 'EXPO_GO_USE_HOOK' para que LoginScreen active el hook.
 * @returns {string} Firebase ID Token
 */
export const signInWithGoogle = async () => {
  if (!_googleNativeReady || !_GoogleSignin) {
    // Señal especial que LoginScreen interpreta para activar promptAsync()
    throw Object.assign(new Error('EXPO_GO_USE_HOOK'), { code: 'EXPO_GO_USE_HOOK' });
  }
  _GoogleSignin.configure({
    webClientId : GOOGLE_CLIENT_ID,
    offlineAccess: false,
  });
  await _GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await _GoogleSignin.signIn();
  if (!_isSuccessResponse(response)) {
    throw new Error('Inicio de sesión con Google cancelado');
  }
  const { idToken } = response.data;
  const credential  = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  return userCredential.user.getIdToken();
};

// ─── Utilidades Firebase generales ───────────────────────────────────────

export const firebaseSignUp = async (email, password, displayName) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(credential.user, { displayName });
  return credential.user;
};

export const firebaseSignIn = async (email, password) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const getFirebaseIdToken = async (forceRefresh = false) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay usuario autenticado en Firebase');
  return user.getIdToken(forceRefresh);
};

export const firebaseSignOut = async () => signOut(auth);

export const firebaseSendPasswordReset = async (email) => sendPasswordResetEmail(auth, email);

export const getCurrentFirebaseUser = () => auth.currentUser;
