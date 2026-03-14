/**
 * Firestore Service — Almacenamiento de perfiles de usuarios y profesionales
 *
 * Colecciones:
 *   /users/{uid}     — perfil básico (clientes y proveedores)
 *   /providers/{uid} — datos adicionales del profesional
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ─── USUARIOS ────────────────────────────────────────────────

/**
 * Guardar o actualizar el perfil de un usuario en Firestore
 */
export const saveUserProfile = async (uid, data) => {
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Crear perfil de usuario por primera vez (solo si no existe)
 */
export const createUserProfile = async (uid, data) => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      ...data,
      activo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  return (await getDoc(ref)).data();
};

/**
 * Obtener el perfil de un usuario desde Firestore
 */
export const getUserProfile = async (uid) => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { uid, ...snap.data() } : null;
};

/**
 * Actualizar campos específicos del perfil de usuario
 */
export const updateUserProfile = async (uid, data) => {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

// ─── PROVEEDORES ─────────────────────────────────────────────

/**
 * Crear o actualizar el perfil del profesional en Firestore
 */
export const saveProviderProfile = async (uid, data) => {
  const ref = doc(db, 'providers', uid);
  await setDoc(
    ref,
    {
      uid,
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Crear perfil de proveedor por primera vez
 */
export const createProviderProfile = async (uid, data) => {
  const ref = doc(db, 'providers', uid);
  await setDoc(ref, {
    uid,
    serviciosCompletados: 0,
    calificacionPromedio: 0,
    disponible: false,
    verificado: false,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Obtener el perfil de un proveedor desde Firestore
 */
export const getProviderProfile = async (uid) => {
  const ref = doc(db, 'providers', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { uid, ...snap.data() } : null;
};

/**
 * Actualizar campos específicos del perfil de proveedor
 */
export const updateProviderProfile = async (uid, data) => {
  const ref = doc(db, 'providers', uid);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

/**
 * Buscar proveedores disponibles (para uso futuro, con índice compuesto en Firestore)
 */
export const getAvailableProviders = async () => {
  const q = query(
    collection(db, 'providers'),
    where('disponible', '==', true),
    where('verificado', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
};
