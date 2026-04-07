/**
 * StorageService — Firebase Storage para avatares Homecare 2026
 *
 * Sube imágenes de perfil, las redimensiona y retorna la URL pública.
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import * as ImageManipulator from 'expo-image-manipulator';

/** Carpeta en Storage donde se guardan los avatares */
const AVATAR_FOLDER = 'avatars';
/** Tamaño máximo (px) para el largo de la imagen */
const MAX_DIMENSION = 512;
/** Calidad JPEG de compresión */
const JPEG_QUALITY = 0.75;

/**
 * Redimensiona y comprime la imagen antes de subir.
 * Reduce el peso significativamente sin perder calidad visible.
 *
 * @param {string} uri — URI local de la imagen (expo-image-picker)
 * @returns {Promise<{ uri: string }>} URI de la imagen procesada
 */
async function resizeImage(uri) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result;
}

/**
 * Convierte una URI local (file://) a un Blob para subir a Firebase Storage.
 *
 * @param {string} uri — URI local del archivo
 * @returns {Promise<Blob>}
 */
async function uriToBlob(uri) {
  const response = await fetch(uri);
  return response.blob();
}

/**
 * Sube la foto de perfil del usuario a Firebase Storage.
 *
 * @param {string} uid — ID del usuario
 * @param {string} localUri — URI local de la imagen seleccionada
 * @returns {Promise<string>} URL pública de descarga
 */
export async function uploadAvatar(uid, localUri) {
  try {
    // 1. Redimensionar
    const resized = await resizeImage(localUri);

    // 2. Convertir a Blob
    const blob = await uriToBlob(resized.uri);

    // 3. Si ya existe un avatar previo, eliminarlo (mantener solo 1)
    const oldRef = ref(storage, `${AVATAR_FOLDER}/${uid}.jpg`);
    try { await deleteObject(oldRef); } catch (_) { /* no existe, ignorar */ }

    // 4. Subir nuevo avatar
    const newRef = ref(storage, `${AVATAR_FOLDER}/${uid}.jpg`);
    await uploadBytes(newRef, blob, {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=86400',
    });

    // 5. Obtener URL pública
    const url = await getDownloadURL(newRef);
    return url;
  } catch (error) {
    console.error('Error subiendo avatar:', error);
    throw new Error('No se pudo subir la foto de perfil.');
  }
}

/**
 * Elimina el avatar del usuario de Firebase Storage.
 *
 * @param {string} uid — ID del usuario
 */
export async function deleteAvatar(uid) {
  try {
    const avatarRef = ref(storage, `${AVATAR_FOLDER}/${uid}.jpg`);
    await deleteObject(avatarRef);
  } catch (_) {
    /* Si no existe, no hay nada que hacer */
  }
}
