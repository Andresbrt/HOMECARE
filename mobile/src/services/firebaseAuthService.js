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
} from 'firebase/auth';
import { auth } from '../config/firebase';

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
