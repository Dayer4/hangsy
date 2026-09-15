import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconMail, IconLock, IconEye, IconEyeOff, IconCar } from '../components/icons.jsx'
import { login, loginWithGoogle } from '../lib/api.js'
import { setToken } from '../lib/auth.js'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const googleButtonRef = useRef(null)

  const handleGoogleCredential = useCallback(
    async (response) => {
      setError('')
      try {
        const { access_token } = await loginWithGoogle(response.credential)
        setToken(access_token)
        navigate('/')
      } catch (err) {
        setError(err.message || 'Google sign-in failed')
      }
    },
    [navigate]
  )

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    let cancelled = false

    function renderButton() {
      if (cancelled || !window.google || !googleButtonRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      })
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
      })
    }

    if (window.google) {
      renderButton()
    } else {
      // GSI's script tag is async/defer, so it may not be ready yet on first render.
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval)
          renderButton()
        }
      }, 100)
      return () => {
        cancelled = true
        clearInterval(interval)
      }
    }
  }, [handleGoogleCredential])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { access_token } = await login(username, password)
      setToken(access_token)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
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
          <h1>Welcome back</h1>
          <p className="muted">Plan the next one.</p>

          <form className="login-form" onSubmit={handleSubmit}>
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
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                autoComplete="current-password"
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

            {error && <p className="login-error">{error}</p>}

            <div className="login-forgot">Forgot password?</div>

            <button type="submit" className="btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <div className="divider">
            <span />
            <span>or</span>
            <span />
          </div>

          {GOOGLE_CLIENT_ID ? (
            <div className="google-button-wrap" ref={googleButtonRef} />
          ) : (
            <button
              type="button"
              className="btn-secondary btn-block"
              disabled
              title="Set VITE_GOOGLE_CLIENT_ID in frontend/.env to enable this"
            >
              Continue with Google
            </button>
          )}

          <p className="login-footer">
            No account yet? <Link to="/">Plan a hangout without one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
