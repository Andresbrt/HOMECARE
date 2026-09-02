/**
 * storageService.js
 * Gestión de fotos en Supabase Storage.
 * Maneja subida de fotos "antes" y "después" de servicios de limpieza,
 * así como fotos de perfil (avatares).
 *
 * Buckets requeridos en Supabase Storage:
 *   - "evidencias" (privado, con RLS)
 *   - "avatares"   (público)
 */

import { supabase } from '../config/supabase';
import * as ImageManipulator from 'expo-image-manipulator';

const BUCKET_EVIDENCIAS = 'evidencias';
const BUCKET_AVATARES = 'avatares';
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.75;

// ─── IMAGEN HELPERS ───────────────────────────────────────────────────────────

async function resizeImage(uri) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result;
}

async function uriToBlob(uri) {
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`No se pudo leer el archivo: ${uri}`);
  return response.blob();
}

// ─── FOTOS DE EVIDENCIA ───────────────────────────────────────────────────────

/**
 * Sube una foto de evidencia (antes/después) al storage.
 *
 * @param {number} servicioId
 * @param {'antes' | 'despues'} tipo
 * @param {string} localUri - URI local del dispositivo
 * @returns {Promise<string>} URL firmada de la imagen
 */
export async function subirFotoEvidencia(servicioId, tipo, localUri) {
  const resized = await resizeImage(localUri);
  const blob = await uriToBlob(resized.uri);
  const timestamp = Date.now();
  const filePath = `servicios/${servicioId}/${tipo}/${timestamp}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_EVIDENCIAS)
    .upload(filePath, blob, { contentType: 'image/jpeg', upsert: false });

  if (uploadError) throw new Error(`Error al subir foto: ${uploadError.message}`);

  const { data: urlData, error: urlError } = await supabase.storage
    .from(BUCKET_EVIDENCIAS)
    .createSignedUrl(filePath, 365 * 24 * 60 * 60); // 1 año

  if (urlError) throw new Error(`Error generando URL: ${urlError.message}`);
  return urlData.signedUrl;
}

/**
 * Sube múltiples fotos "antes" y guarda las URLs en la DB.
 */
export async function subirFotosAntes(servicioId, localUris) {
  const urls = await Promise.all(
    localUris.map((uri) => subirFotoEvidencia(servicioId, 'antes', uri))
  );
  await _guardarFotosEnServicio(servicioId, 'fotos_antes', urls);
  return urls;
}

/**
 * Sube múltiples fotos "después" y guarda las URLs en la DB.
 */
export async function subirFotosDespues(servicioId, localUris) {
  const urls = await Promise.all(
    localUris.map((uri) => subirFotoEvidencia(servicioId, 'despues', uri))
  );
  await _guardarFotosEnServicio(servicioId, 'fotos_despues', urls);
  return urls;
}

/**
 * Obtiene las fotos (antes y después) de un servicio.
 */
export async function getFotosServicio(servicioId) {
  const { data, error } = await supabase
    .from('servicios_aceptados')
    .select('fotos_antes, fotos_despues')
    .eq('id', servicioId)
    .single();

  if (error) throw new Error(error.message);
  return {
    fotos_antes: data.fotos_antes || [],
    fotos_despues: data.fotos_despues || [],
  };
}

// ─── FOTO DE PERFIL (AVATAR) ──────────────────────────────────────────────────

/**
 * Sube o actualiza la foto de perfil del usuario.
 * Compatible con la firma anterior: uploadAvatar(uid, localUri).
 *
 * @param {string} uid - UUID del usuario
 * @param {string} localUri - URI local de la imagen
 * @returns {Promise<string>} URL pública del avatar
 */
export async function uploadAvatar(uid, localUri) {
  const resized = await resizeImage(localUri);
  const blob = await uriToBlob(resized.uri);
  const filePath = `${uid}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_AVATARES)
    .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

  if (uploadError) throw new Error(`Error al subir avatar: ${uploadError.message}`);

  const { data } = supabase.storage.from(BUCKET_AVATARES).getPublicUrl(filePath);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

  await supabase.from('usuarios').update({ foto_perfil: publicUrl }).eq('id', uid);
  return publicUrl;
}

/**
 * Alias mantenido para compatibilidad. En Supabase no hay delete necesario
 * porque usamos upsert=true en el upload.
 */
export async function deleteAvatar(_uid) {
  // No-op: el upsert en Supabase sobreescribe automáticamente.
}

// ─── HELPERS PRIVADOS ─────────────────────────────────────────────────────────

async function _guardarFotosEnServicio(servicioId, campo, nuevasUrls) {
  const { data } = await supabase
    .from('servicios_aceptados')
    .select(campo)
    .eq('id', servicioId)
    .single();

  const urlsActuales = (data && data[campo]) || [];
  const urlsCombinadas = [...urlsActuales, ...nuevasUrls];

  const { error } = await supabase
    .from('servicios_aceptados')
    .update({ [campo]: urlsCombinadas })
    .eq('id', servicioId);

  if (error) throw new Error(`Error guardando fotos en DB: ${error.message}`);
}
