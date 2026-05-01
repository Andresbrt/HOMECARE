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

/**
 * Login con Google OAuth.
 * En React Native usa signInWithOAuth con redirect.
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'homecare://auth/callback',
    },
  });
  if (error) throw new Error(error.message);
  return data;
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
