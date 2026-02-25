import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './NavBar.css'

export function NavBar() {
  const { user, loading, signOut, isAuthenticated } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo">Rhino Viewer</span>
      </div>
      <nav className="navbar__links">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
          }
          end
        >
          Visor
        </NavLink>
        <NavLink
          to="/gallery"
          className={({ isActive }) =>
            isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
          }
        >
          Galería
        </NavLink>
        {isAuthenticated && (
          <NavLink
            to="/models"
            className={({ isActive }) =>
              isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
            }
          >
            Mis modelos
          </NavLink>
        )}
        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
          }
        >
          About
        </NavLink>
        <NavLink
          to="/contact"
          className={({ isActive }) =>
            isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
          }
        >
          Contacto
        </NavLink>
        {!loading && (
          <>
            {isAuthenticated ? (
              <div className="navbar__user">
                <button
                  type="button"
                  className="navbar__user-btn"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="navbar__avatar"
                    />
                  ) : (
                    <span className="navbar__avatar-placeholder">
                      {(user?.email?.[0] || '?').toUpperCase()}
                    </span>
                  )}
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="navbar__backdrop"
                      role="presentation"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="navbar__dropdown">
                      <p className="navbar__dropdown-email">{user?.email}</p>
                      <button
                        type="button"
                        className="navbar__dropdown-item"
                        onClick={handleLogout}
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <NavLink to="/login" className="navbar__link">
                  Entrar
                </NavLink>
                <NavLink
                  to="/register"
                  className="navbar__link navbar__link--cta"
                >
                  Registrarse
                </NavLink>
              </>
            )}
          </>
        )}
      </nav>
    </header>
  )
}

