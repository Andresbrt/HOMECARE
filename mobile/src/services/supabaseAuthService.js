/**
 * supabaseAuthService.js
 * Servicio de autenticación 100% Supabase Auth
 * Reemplaza completamente Firebase Auth
 */

import { supabase } from '../config/supabase';

// ─── REGISTRO ────────────────────────────────────────────────────────────────

/**
 * Registra un nuevo usuario con email y contraseña.
 * Los metadatos (nombre, apellido, rol) alimentan el trigger handle_new_user
 * que crea automáticamente la fila en public.usuarios.
 */
export async function signUp({ email, password, nombre, apellido, rol = 'CUSTOMER', telefono }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre,
        apellido,
        rol,
        telefono: telefono || null,
      },
    },
  });

  if (error) throw new Error(error.message);

  // Asignar rol en la tabla usuario_roles
  if (data.user) {
    await _asignarRol(data.user.id, rol);
  }

  return data;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

/**
 * Inicia sesión con email y contraseña.
 */
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

import { NativeModules, TurboModuleRegistry, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

/**
 * Detecta de forma segura si el binario nativo tiene registrado RNGoogleSignin.
 * En Expo Go o builds sin el módulo compilado nativamente, retorna false para evitar
 * el error fatal 'TurboModuleRegistry.getEnforcing(...): RNGoogleSignin could not be found'.
 */
function isNativeGoogleSigninAvailable() {
  try {
    if (Platform.OS === 'web') return false;
    const isExpoGo = Constants?.appOwnership === 'expo' || Constants?.executionEnvironment === 'storeClient';
    if (isExpoGo) return false;

    const turboModule = TurboModuleRegistry?.get ? TurboModuleRegistry.get('RNGoogleSignin') : null;
    const legacyModule = NativeModules?.RNGoogleSignin;
    return Boolean(turboModule || legacyModule);
  } catch (_) {
    return false;
  }
}

/**
 * Login y Registro universal con Google.
 * 1. Intenta flujo nativo con GoogleSignin si está disponible (Google Play Services / iOS)
 * 2. Fallback a WebBrowser.openAuthSessionAsync contra Supabase OAuth con captura de tokens/PKCE
 */
export async function signInWithGoogle() {
  // 1. Intentar Google Sign-In nativo solo si el binario nativo lo tiene registrado
  if (isNativeGoogleSigninAvailable()) {
    try {
      const GoogleSigninModule = require('@react-native-google-signin/google-signin');
      const GoogleSignin = GoogleSigninModule?.GoogleSignin;
      if (GoogleSignin && typeof GoogleSignin.hasPlayServices === 'function') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const signInResult = await GoogleSignin.signIn();
        const idToken = signInResult?.data?.idToken || signInResult?.idToken;
        if (idToken) {
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });
          if (error) throw error;
          if (data?.session) return data.session;
        }
      }
    } catch (nativeErr) {
      if (nativeErr.code === 'SIGN_IN_CANCELLED' || nativeErr.code === '12501') {
        return null; // Usuario canceló explícitamente
      }
      // Fallback silencioso a WebBrowser
    }
  }

  // 2. Fallback universal vía WebBrowser (Expo WebBrowser + Supabase OAuth)
  try {
    let redirectTo = 'homecare://auth/callback';
    try {
      if (AuthSession?.makeRedirectUri) {
        redirectTo = AuthSession.makeRedirectUri({
          scheme: 'homecare',
          path: 'auth/callback',
        });
      }
    } catch (_) {}
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('No se pudo generar la URL de autenticación con Google');

    const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (authResult.type === 'success' && authResult.url) {
      // Caso A: tokens en el hash (#access_token=...&refresh_token=...)
      if (authResult.url.includes('#')) {
        const fragment = authResult.url.split('#')[1] || '';
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken) {
          const { data: sessionData, error: sErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          if (sErr) throw sErr;
          return sessionData.session;
        }
      }

      // Caso B: código PKCE en query params (?code=...) o tokens directos
      if (authResult.url.includes('?')) {
        const query = authResult.url.split('?')[1] || '';
        const params = new URLSearchParams(query);
        const code = params.get('code');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (code) {
          const { data: codeData, error: cErr } = await supabase.auth.exchangeCodeForSession(code);
          if (cErr) throw cErr;
          return codeData.session;
        }

        if (accessToken) {
          const { data: sessionData, error: sErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          if (sErr) throw sErr;
          return sessionData.session;
        }
      }
    }

    if (authResult.type === 'cancel' || authResult.type === 'dismiss') {
      return null;
    }

    // Verificar si la sesión quedó activa
    const { data: sessionInfo } = await supabase.auth.getSession();
    return sessionInfo?.session || null;
  } catch (webErr) {
    throw new Error(webErr.message || 'Error durante la autenticación con Google');
  }
}

// ─── SESIÓN ───────────────────────────────────────────────────────────────────

/**
 * Obtiene la sesión activa del usuario.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

/**
 * Obtiene el usuario autenticado actual.
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user;
}

/**
 * Cierra la sesión del usuario.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

// ─── RECUPERACIÓN DE CONTRASEÑA ───────────────────────────────────────────────

/**
 * Envía email de recuperación de contraseña.
 * Supabase maneja el envío via SMTP configurado (Brevo/Zoho).
 */
export async function sendPasswordResetEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'homecare://auth/reset-password',
  });
  if (error) throw new Error(error.message);
}

/**
 * Actualiza la contraseña del usuario autenticado.
 */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

// ─── PERFIL DE USUARIO ────────────────────────────────────────────────────────

/**
 * Obtiene el perfil completo del usuario desde public.usuarios.
 */
export async function getUsuarioPerfil(userId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      *,
      usuario_roles (
        roles ( nombre, descripcion )
      )
    `)
    .eq('id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Actualiza el perfil del usuario en public.usuarios.
 */
export async function updateUsuarioPerfil(userId, updates) {
  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── LISTENER DE AUTENTICACIÓN ────────────────────────────────────────────────

/**
 * Escucha cambios de sesión (login, logout, refresh).
 * @param {Function} callback - Función llamada con (event, session)
 * @returns {Function} - Función para desuscribirse
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

// ─── HELPERS PRIVADOS ─────────────────────────────────────────────────────────

async function _asignarRol(userId, rolNombre) {
  // Obtener el id del rol
  const { data: rol, error: rolError } = await supabase
    .from('roles')
    .select('id')
    .eq('nombre', rolNombre)
    .single();

  if (rolError || !rol) {
    console.warn('[Auth] No se pudo obtener el rol:', rolNombre);
    return;
  }

  const { error } = await supabase
    .from('usuario_roles')
    .insert({ usuario_id: userId, rol_id: rol.id });

  if (error) console.warn('[Auth] Error asignando rol:', error.message);
}
