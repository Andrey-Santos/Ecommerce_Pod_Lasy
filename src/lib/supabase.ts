import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

// Helper para verificar se usuário está autenticado
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper para verificar se usuário é admin
export async function isAdmin() {
  const user = await getUser();
  if (!user) return false;
  
  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  
  return data?.is_admin || false;
}
