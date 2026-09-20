import { createClient } from '@supabase/supabase-js';

// Obtenemos la URL y la Key de las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY no está definida. La conexión con Supabase podría fallar.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
