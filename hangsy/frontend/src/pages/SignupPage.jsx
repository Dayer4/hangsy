import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconMail, IconLock, IconCar } from '../components/icons.jsx'
import { register } from '../lib/api.js'

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register({ username, email, fullName, password })
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="login-split">
        <div className="login-brand-panel">
          <div className="login-brand-mark">
            <IconCar />
          </div>
          <div className="login-brand-title">Hangsy</div>
        </div>
        <div className="login-form-panel">
          <div className="login-form-wrap">
            <h1>Check your email</h1>
            <p className="muted">
              We sent a verification link to <strong>{email}</strong>. Click it
              to activate your account, then come back and log in.
            </p>
            <button type="button" className="btn-primary btn-block" onClick={() => navigate('/login')}>
              Go to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-split">
      <div className="login-brand-panel">
        <div className="login-brand-mark">
          <IconCar />
        </div>
        <div className="login-brand-title">Hangsy</div>
        <p className="login-brand-copy">
          Coordinate who's buying what, and who's driving whom, without the
          group chat spiral.
        </p>
      </div>

      <div className="login-form-panel">
        <div className="login-form-wrap">
          <h1>Create an account</h1>
          <p className="muted">Takes a minute.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <IconMail />
              <input
                type="text"
                placeholder="Full name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <IconMail />
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <IconMail />
              <input
                type="text"
                placeholder="Username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <IconLock />
              <input
                type="password"
                placeholder="Password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="login-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
