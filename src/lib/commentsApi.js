import { supabase } from './supabase'

/** Comentarios de un modelo (con autor si hay profiles) */
export async function getCommentsByModelId(modelId) {
  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      id,
      position,
      body,
      created_at,
      user_id
    `,
    )
    .eq('model_id', modelId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
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
