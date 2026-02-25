import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getMyModels } from '../lib/modelsApi'
import './MyModelsPage.css'

export function MyModelsPage() {
  const { user, loading: authLoading } = useAuth()
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/models', { replace: true })
      return
    }
    let cancelled = false
    getMyModels(user.id)
      .then((data) => {
        if (!cancelled) setModels(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Error al cargar modelos')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [user, navigate])

  if (authLoading || !user) return null

  return (
    <section className="my-models-page">
      <h1 className="my-models-page__title">Mis modelos</h1>
      {error && <p className="my-models-page__error">{error}</p>}
      {loading ? (
        <p className="my-models-page__loading">Cargando…</p>
      ) : models.length === 0 ? (
        <p className="my-models-page__empty">
          Aún no has subido ningún modelo. Ve al <Link to="/">visor</Link>, sube
          un archivo .3dm y usa «Subir modelo» para guardarlo y poder añadir
          comentarios.
        </p>
      ) : (
        <ul className="models-list">
          {models.map((m) => (
            <li key={m.id} className="models-list__item">
              <Link to={`/view/${m.id}`} className="models-list__link">
                <span className="models-list__name">{m.name}</span>
                <span className="models-list__date">
                  {new Date(m.created_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
