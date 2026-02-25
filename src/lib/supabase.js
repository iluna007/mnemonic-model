import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

const hasConfig =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY

if (!hasConfig) {
  console.warn(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env. Auth y comentarios no funcionarán hasta que los añadas.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const isSupabaseConfigured = !!hasConfig

/** Mensaje amigable para errores de red (Failed to fetch, etc.) */
export function getAuthErrorMessage(err) {
  const msg = err?.message || ''
  if (
    msg === 'Failed to fetch' ||
    msg.includes('NetworkError') ||
    msg.includes('Load failed') ||
    (err?.name === 'TypeError' && msg.includes('fetch'))
  ) {
    return 'No se pudo conectar al servidor. Comprueba que el archivo .env tenga VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY correctos, que el proyecto Supabase no esté pausado y tu conexión a internet.'
  }
  return msg || 'Error inesperado'
}
