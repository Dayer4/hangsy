import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RootPage from './pages/RootPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import ShoppingListPage from './pages/ShoppingListPage.jsx'
import RouteMapPage from './pages/RouteMapPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify" element={<VerifyEmailPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<RootPage />} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hangouts/:hangoutId/shopping"
          element={
            <ProtectedRoute>
              <ShoppingListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hangouts/:hangoutId/route"
          element={
            <ProtectedRoute>
              <RouteMapPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
