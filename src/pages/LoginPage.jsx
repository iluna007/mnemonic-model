import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured, getAuthErrorMessage } from '../lib/supabase'
import './AuthPages.css'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signInWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmail(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Iniciar sesión</h1>
        {!isSupabaseConfigured && (
          <p className="auth-card__warn">
            Configura <code>.env</code> con las variables de Supabase (ver
            SUPABASE_SETUP.md). Reinicia el servidor tras cambiar .env.
          </p>
        )}
        {error && <p className="auth-card__error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-form__label">
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-form__input"
              required
              autoComplete="email"
            />
          </label>
          <label className="auth-form__label">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-form__input"
              required
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            className="auth-form__submit"
            disabled={loading || !isSupabaseConfigured}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="auth-divider">o</div>

        <button
          type="button"
          className="auth-google"
          onClick={handleGoogle}
          disabled={loading || !isSupabaseConfigured}
        >
          <span className="auth-google__icon" aria-hidden>G</span>
          Continuar con Google
        </button>

        <p className="auth-card__footer">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </section>
  )
}
