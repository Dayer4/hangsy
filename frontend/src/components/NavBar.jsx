import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { IconSettings, IconLogout, IconChevronDown } from './icons.jsx'
import { isAuthenticated, clearToken } from '../lib/auth.js'
import { getMe } from '../lib/api.js'

export default function NavBar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()

  useEffect(() => {
    if (loggedIn) {
      getMe().then(setUser).catch(() => {})
    }
  }, [loggedIn])

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    clearToken()
    setOpen(false)
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          Hangsy
        </NavLink>

        <div className="navbar-spacer" />

        {loggedIn ? (
          <div className="navbar-user" ref={menuRef}>
            <button
              type="button"
              className="navbar-avatar-btn"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              <span className="navbar-avatar">
                {user?.profile_picture_url ? (
                  <img src={user.profile_picture_url} alt="" />
                ) : (
                  user?.full_name?.charAt(0).toUpperCase() || '?'
                )}
              </span>
              <IconChevronDown
                className={`navbar-caret ${open ? 'navbar-caret-open' : ''}`}
              />
            </button>

            {open && (
              <div className="navbar-dropdown">
                <NavLink
                  to="/settings"
                  className="navbar-dropdown-item"
                  onClick={() => setOpen(false)}
                >
                  <IconSettings /> Settings
                </NavLink>
                <button
                  type="button"
                  className="navbar-dropdown-item navbar-dropdown-danger"
                  onClick={handleLogout}
                >
                  <IconLogout /> Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="navbar-guest-actions">
            <NavLink to="/login" className="btn-secondary">
              Log in
            </NavLink>
            <NavLink to="/signup" className="btn-primary">
              Get started
            </NavLink>
          </div>
        )}
      </div>
    </header>
  )
}
