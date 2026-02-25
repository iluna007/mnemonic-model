import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured, getAuthErrorMessage } from '../lib/supabase'
import './AuthPages.css'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUpWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!nickname.trim()) {
      setError('Elige un nombre de usuario (nickname)')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      await signUpWithEmail(email, password, {
        display_name: nickname.trim(),
      })
      navigate('/', { replace: true })
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
      navigate('/', { replace: true })
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Crear cuenta</h1>
        {!isSupabaseConfigured && (
          <p className="auth-card__warn">
            Configura <code>.env</code> con <code>VITE_SUPABASE_URL</code> y{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> (ver SUPABASE_SETUP.md). Reinicia
            el servidor tras cambiar .env.
          </p>
        )}
        {error && <p className="auth-card__error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-form__label">
            Nombre de usuario (nickname)
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="auth-form__input"
              required
              minLength={2}
              maxLength={50}
              placeholder="Cómo te verán en los comentarios"
              autoComplete="username"
            />
          </label>
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
            Contraseña (mín. 6)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-form__input"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label className="auth-form__label">
            Repetir contraseña
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-form__input"
              required
              autoComplete="new-password"
            />
          </label>
          <button
            type="submit"
            className="auth-form__submit"
            disabled={loading || !isSupabaseConfigured}
          >
            {loading ? 'Creando cuenta…' : 'Registrarme'}
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
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </section>
  )
}
