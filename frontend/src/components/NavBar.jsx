import { NavLink } from 'react-router-dom'
import { IconHome, IconSettings } from './icons.jsx'

export default function NavBar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          Hangsy
        </NavLink>

        <nav className="navbar-links">
          <NavLink to="/" end className="navbar-link">
            <IconHome /> Home
          </NavLink>
          <NavLink to="/settings" className="navbar-link">
            <IconSettings /> Settings
          </NavLink>
        </nav>

        <div className="navbar-user">
          <span className="navbar-avatar">Y</span>
          <span className="navbar-username">Yaonge</span>
        </div>
      </div>
    </header>
  )
}
