import { supabase } from './supabase'

/** Crea o actualiza el perfil del usuario actual (nickname para comentarios) */
export async function upsertMyProfile(userId, displayName) {
  if (!userId) return
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      display_name: displayName || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) console.warn('upsertMyProfile', error.message)
}

/** Perfiles por lista de ids (para mostrar nombre en comentarios) */
export async function getProfilesByIds(ids) {
  if (!ids?.length) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', ids)
  if (error) return []
  return data || []
}

/** Comentarios de un modelo con display_name del autor (desde profiles) */
export async function getCommentsWithAuthors(modelId) {
  const { data: comments, error } = await supabase
    .from('comments')
    .select('id, position, body, created_at, user_id')
    .eq('model_id', modelId)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!comments?.length) return []

  const userIds = [...new Set(comments.map((c) => c.user_id).filter(Boolean))]
  const profiles = await getProfilesByIds(userIds)
  const byId = Object.fromEntries(
    (profiles || []).map((p) => [p.id, p.display_name || 'Usuario']),
  )

  return comments.map((c) => ({
    ...c,
    display_name: byId[c.user_id] || 'Usuario',
  }))
}

/** Comentarios de un modelo (solo datos, sin autores) */
export async function getCommentsByModelId(modelId) {
  const { data, error } = await supabase
    .from('comments')
    .select('id, position, body, created_at, user_id')
    .eq('model_id', modelId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/** Inserta un comentario (posición {x,y,z}, body, model_id; user_id desde sesión) */
export async function addComment(modelId, userId, position, body) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      model_id: modelId,
      user_id: userId,
      position: { x: position.x, y: position.y, z: position.z },
      body: body.trim(),
    })
    .select('id, position, body, created_at, user_id')
    .single()

  if (error) throw error
  return data
}

/** Elimina un comentario (solo el autor) */
export async function deleteComment(commentId) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) throw error
}
