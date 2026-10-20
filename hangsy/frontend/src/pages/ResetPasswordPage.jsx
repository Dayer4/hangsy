import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { confirmPasswordChange } from '../lib/api.js'
import { clearToken } from '../lib/auth.js'
import { IconLock, IconEye, IconEyeOff } from '../components/icons.jsx'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [showPw, setShowPw] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPw) {
      setError("Passwords don't match")
      return
    }

    setSubmitting(true)
    try {
      await confirmPasswordChange(token, password)
      // A password change invalidates every session server-side (see
      // routers/auth.py) — this browser's stored token is now dead too, so
      // there's no point keeping it around.
      clearToken()
      navigate('/login', { state: { message: 'Password changed — log in with your new password.' } })
    } catch (err) {
      setError(err.message || 'Could not change password')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="login-split">
        <div className="login-form-panel">
          <div className="login-form-wrap" style={{ textAlign: 'center' }}>
            <h1>Missing link</h1>
            <p className="muted">This page needs a reset link — check the email you were sent.</p>
            <Link to="/login" className="btn-secondary btn-block">Back to login</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-split">
      <div className="login-form-panel">
        <div className="login-form-wrap">
          <h1>Set a new password</h1>
          <p className="muted">At least 8 characters.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <IconLock />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="New password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="field-trailing"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <IconEyeOff /> : <IconEye />}
              </button>
            </label>

            <label className="field">
              <IconLock />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Confirm new password"
                autoComplete="new-password"
                minLength={8}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
              />
            </label>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Changing…' : 'Change password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
