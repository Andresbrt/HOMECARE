/**
 * storageHelpers.ts
 * Utilidades para gestionar archivos en Supabase Storage.
 * Garantiza nombres únicos, no colisiones, y organización por servicio.
 */

import { supabase } from '../config/supabase';
import * as ImageManipulator from 'expo-image-manipulator';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type TipoFoto = 'antes' | 'despues' | 'avatar';

export interface UploadResult {
  ok: boolean;
  publicUrl?: string;
  signedUrl?: string;
  path?: string;
  error?: string;
}

// ── Constantes de buckets ─────────────────────────────────────────────────────

const BUCKET_EVIDENCIAS = 'evidencias-servicios';
const BUCKET_PERFILES   = 'perfiles-usuarios';

// Calidad de compresión JPEG (0-1). 0.82 es el punto óptimo calidad/tamaño.
const JPEG_QUALITY = 0.82;

// Dimensión máxima en píxeles (ancho o alto)
const MAX_DIMENSION = 1280;

// ── Función central: generar nombre de archivo único ─────────────────────────

/**
 * Genera un nombre de archivo único que evita colisiones en Storage.
 *
 * Formato: {referenciaId}_{timestamp}_{tipo}_{random4}.jpg
 * Ejemplo: "147_1745430000000_antes_a3f2.jpg"
 *
 * @param referenciaId  ID de la solicitud, servicio u objeto relacionado
 * @param tipo          'antes' | 'despues' | 'avatar'
 * @param extension     Extensión sin punto. Por defecto 'jpg'.
 */
export function generarNombreUnico(
  referenciaId: number | string,
  tipo: TipoFoto,
  extension = 'jpg'
): string {
  const timestamp = Date.now();
  // 4 caracteres hex aleatorios para el caso de múltiples subidas en el mismo ms
  const random = Math.random().toString(16).slice(2, 6);
  return `${referenciaId}_${timestamp}_${tipo}_${random}.${extension}`;
}

/**
 * Construye la ruta completa dentro del bucket.
 *
 * Para evidencias: {servicioId}/{uid}/{filename}
 * Para perfiles:   {uid}/{filename}
 */
function buildPath(
  bucket: typeof BUCKET_EVIDENCIAS | typeof BUCKET_PERFILES,
  uid: string,
  filename: string,
  servicioId?: number | string
): string {
  if (bucket === BUCKET_EVIDENCIAS) {
    if (!servicioId) throw new Error('servicioId es requerido para evidencias');
    return `${servicioId}/${uid}/${filename}`;
  }
  return `${uid}/${filename}`;
}

// ── Compresión y redimensionado ───────────────────────────────────────────────

/**
 * Comprime y redimensiona una imagen local antes de subir.
 * Usa expo-image-manipulator para evitar dependencias nativas complejas.
 *
 * @param localUri  URI local del archivo (de ImagePicker o cámara)
 * @returns URI del archivo comprimido temporal
 */
async function comprimirImagen(localUri: string): Promise<string> {
  const resultado = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: MAX_DIMENSION } }],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );
  return resultado.uri;
}

/**
 * Lee un archivo local como ArrayBuffer para subirlo a Supabase.
 * Compatible con Expo (fetch nativo del runtime de React Native).
 */
async function leerArchivo(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  return response.arrayBuffer();
}

// ── Upload: foto de perfil (avatar) ──────────────────────────────────────────

/**
 * Sube una foto de perfil al bucket público `perfiles-usuarios`.
 * Sobrescribe la foto anterior del mismo usuario (misma ruta base).
 *
 * @param uid       UUID del usuario (auth.uid())
 * @param localUri  URI local de la imagen seleccionada
 */
export async function subirAvatar(
  uid: string,
  localUri: string
): Promise<UploadResult> {
  try {
    const uriComprimida = await comprimirImagen(localUri);
    const filename = generarNombreUnico(uid.slice(0, 8), 'avatar');
    const path = buildPath(BUCKET_PERFILES, uid, filename);
    const buffer = await leerArchivo(uriComprimida);

    const { error } = await supabase.storage
      .from(BUCKET_PERFILES)
      .upload(path, buffer, {
        contentType: 'image/jpeg',
        upsert: true,         // Sobrescribe si ya existía
        cacheControl: '3600', // 1 hora de caché en CDN
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from(BUCKET_PERFILES)
      .getPublicUrl(path);

    return { ok: true, publicUrl: data.publicUrl, path };
  } catch (err: any) {
    console.error('[storageHelpers] subirAvatar error:', err);
    return { ok: false, error: err.message ?? 'Error al subir avatar' };
  }
}

// ── Upload: fotos de evidencia (antes/después) ────────────────────────────────

/**
 * Sube UNA foto de evidencia al bucket privado `evidencias-servicios`.
 *
 * @param servicioId  ID del servicio_aceptado
 * @param uid         UUID del proveedor (auth.uid())
 * @param tipo        'antes' | 'despues'
 * @param localUri    URI local de la imagen
 */
export async function subirFotoEvidencia(
  servicioId: number | string,
  uid: string,
  tipo: 'antes' | 'despues',
  localUri: string
): Promise<UploadResult> {
  try {
    const uriComprimida = await comprimirImagen(localUri);
    const filename = generarNombreUnico(servicioId, tipo);
    const path = buildPath(BUCKET_EVIDENCIAS, uid, filename, servicioId);
    const buffer = await leerArchivo(uriComprimida);

    const { error } = await supabase.storage
      .from(BUCKET_EVIDENCIAS)
      .upload(path, buffer, {
        contentType: 'image/jpeg',
        upsert: false, // Las evidencias NO se sobrescriben (trazabilidad)
        cacheControl: '86400',
      });

    if (error) throw error;

    // Generar URL firmada con 1 año de validez (evidencias son confidenciales)
    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET_EVIDENCIAS)
      .createSignedUrl(path, 365 * 24 * 60 * 60);

    if (signErr) throw signErr;

    return { ok: true, signedUrl: signed.signedUrl, path };
  } catch (err: any) {
    console.error('[storageHelpers] subirFotoEvidencia error:', err);
    return { ok: false, error: err.message ?? 'Error al subir evidencia' };
  }
}

/**
 * Sube múltiples fotos de evidencia en paralelo (máx 5 por tipo).
 * Retorna un array con los paths almacenados (para guardar en la DB).
 *
 * @param servicioId  ID del servicio_aceptado
 * @param uid         UUID del proveedor
 * @param tipo        'antes' | 'despues'
 * @param localUris   Lista de URIs locales (máx 5)
 */
export async function subirFotosEvidenciaLote(
  servicioId: number | string,
  uid: string,
  tipo: 'antes' | 'despues',
  localUris: string[]
): Promise<{ paths: string[]; errores: string[] }> {
  const MAX_FOTOS = 5;
  const urisLimitadas = localUris.slice(0, MAX_FOTOS);

  const resultados = await Promise.allSettled(
    urisLimitadas.map((uri) => subirFotoEvidencia(servicioId, uid, tipo, uri))
  );

  const paths: string[] = [];
  const errores: string[] = [];

  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value.ok && r.value.path) {
      paths.push(r.value.path);
    } else {
      const msg = r.status === 'rejected'
        ? r.reason?.message
        : (r.value as UploadResult).error;
      errores.push(`Foto ${i + 1}: ${msg ?? 'Error desconocido'}`);
    }
  });

  return { paths, errores };
}

/**
 * Obtiene URLs firmadas para un conjunto de paths de evidencias.
 * Útil para mostrar las fotos en pantalla después de subidas.
 *
 * @param paths   Array de paths tal como se guardaron en la DB
 * @param ttlSeg  Tiempo de validez de la URL en segundos (default 1 hora)
 */
export async function obtenerUrlsFirmadas(
  paths: string[],
  ttlSeg = 3600
): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET_EVIDENCIAS)
    .createSignedUrls(paths, ttlSeg);

  if (error || !data) {
    console.error('[storageHelpers] obtenerUrlsFirmadas error:', error);
    return [];
  }

  return data
    .filter((d) => d.signedUrl)
    .map((d) => d.signedUrl as string);
}

/**
 * Elimina el avatar anterior de un usuario.
 * Útil antes de subir uno nuevo si quieres limpiar el bucket.
 *
 * @param uid       UUID del usuario
 * @param oldPath   Path exacto del archivo a eliminar
 */
export async function eliminarAvatar(uid: string, oldPath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_PERFILES)
    .remove([oldPath]);

  if (error) {
    console.warn('[storageHelpers] eliminarAvatar error (no crítico):', error.message);
  }
}
