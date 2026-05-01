/**
 * Supabase Client Configuration
 * Proyecto: Homecare
 *
 * SETUP REQUERIDO:
 * 1. Ve a https://supabase.com → tu proyecto → Settings → API
 * 2. Copia la "Project URL" y la "anon public key"
 * 3. Reemplaza los valores en app.json > extra > supabaseUrl y supabaseAnonKey
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const extra =
  Constants.expoConfig?.extra ||
  Constants.manifest?.extra ||
  Constants.manifest2?.extra ||
  {};

const supabaseUrl = extra.supabaseUrl || process.env.SUPABASE_URL;
const supabaseAnonKey = extra.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Faltan supabaseUrl o supabaseAnonKey en app.json > extra o variables de entorno'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
