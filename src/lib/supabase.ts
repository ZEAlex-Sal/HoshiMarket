import { createClient } from '@supabase/supabase-js';

// Compatible con NEXT_PUBLIC_SUPABASE_*, SUPABASE_* o prefijo personalizado STORAGE_*
const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  process.env.NEXT_PUBLIC_STORAGE_URL || 
  process.env.STORAGE_URL || 
  '';

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_STORAGE_ANON_KEY || 
  process.env.STORAGE_ANON_KEY || 
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
