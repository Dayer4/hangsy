import { Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import { isAuthenticated } from '../lib/auth.js'

export default function Layout() {
  const { pathname } = useLocation()
  const isAuthenticatedApp = pathname !== '/try' && isAuthenticated()

  return (
    <div className={isAuthenticatedApp ? 'authenticated-shell' : undefined}>
      <NavBar />
      <main className="page">
        <Outlet />
      </main>
    </div>
  )
}
