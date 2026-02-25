import { NavLink } from 'react-router-dom'

export function NavBar() {
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
      </nav>
    </header>
  )
}

