import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../lib/auth.js'

export default function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}
