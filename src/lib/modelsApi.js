import { supabase } from './supabase'

const BUCKET = 'models'

/** Límite de Supabase Storage en plan gratuito: 50 MB por archivo */
export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024
export const MAX_UPLOAD_SIZE_MB = 50

/** Sube un archivo .3dm y crea la fila en public.models */
export async function uploadModel(file, userId) {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(
      `El archivo supera el límite de ${MAX_UPLOAD_SIZE_MB} MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(1)} MB. Reduce el modelo o usa un plan Supabase con más capacidad.`,
    )
  }

  const ext = file.name.slice(file.name.lastIndexOf('.'))
  const path = `${userId}/${crypto.randomUUID()}${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false })

  if (uploadError) throw uploadError

  const { data: row, error: insertError } = await supabase
    .from('models')
    .insert({ user_id: userId, name: file.name, storage_path: path })
    .select('id, name, created_at')
    .single()

  if (insertError) throw insertError
  return row
}

/** URL pública (solo si el bucket es público) */
export function getModelFileUrl(storagePath) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

/** URL firmada (para buckets privados; válida 1 h) */
export async function getModelFileSignedUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60)
  if (error) throw error
  return data.signedUrl
}

/** Lista todos los modelos (galería pública) */
export async function getAllModels() {
  const { data, error } = await supabase
    .from('models')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/** Lista los modelos del usuario actual */
export async function getMyModels(userId) {
  const { data, error } = await supabase
    .from('models')
    .select('id, name, created_at, storage_path')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/** Obtiene un modelo por id (para verlo y cargar comentarios) */
export async function getModelById(modelId) {
  const { data, error } = await supabase
    .from('models')
    .select('id, name, storage_path, user_id')
    .eq('id', modelId)
    .single()

  if (error) throw error
  return data
}
