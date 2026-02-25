import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllModels } from '../lib/modelsApi'
import './GalleryPage.css'

export function GalleryPage() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getAllModels()
      .then((data) => {
        if (!cancelled) setModels(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Error al cargar la galería')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <section className="gallery-page">
      <h1 className="gallery-page__title">Galería de modelos</h1>
      <p className="gallery-page__subtitle">
        Entra en cualquier modelo para verlo en 3D y leer o dejar comentarios.
        Inicia sesión para poder añadir comentarios.
      </p>
      {error && <p className="gallery-page__error">{error}</p>}
      {loading ? (
        <p className="gallery-page__loading">Cargando…</p>
      ) : models.length === 0 ? (
        <p className="gallery-page__empty">
          Aún no hay modelos en la galería. Sube el primero desde el{' '}
          <Link to="/">visor</Link> (inicia sesión y usa «Subir modelo»).
        </p>
      ) : (
        <ul className="gallery-page__list">
          {models.map((m) => (
            <li key={m.id} className="gallery-page__item">
              <Link to={`/view/${m.id}`} className="gallery-page__link">
                <span className="gallery-page__name">{m.name}</span>
                <span className="gallery-page__date">
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
