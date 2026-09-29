import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { IconMail, IconLock, IconEye, IconEyeOff, IconCar } from '../components/icons.jsx'
import { login, loginWithGoogle, forgotPassword, resendVerification } from '../lib/api.js'
import { setToken } from '../lib/auth.js'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [unverified, setUnverified] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotUsername, setForgotUsername] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const [forgotSending, setForgotSending] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
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
    setUnverified(false)
    setResendMessage('')
    setSubmitting(true)
    try {
      const { access_token } = await login(username, password)
      setToken(access_token)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed')
      // Matches the exact wording routers/auth.py's login() raises for an
      // unverified account — brittle to a wording change there, but this
      // avoids adding a machine-readable error code for just one case.
      setUnverified((err.message || '').toLowerCase().includes('verify your email'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setResendMessage('')
    try {
      const res = await resendVerification({ username })
      setResendMessage(res.message)
    } catch (err) {
      setResendMessage(err.message)
    }
  }

  async function handleForgotSubmit(e) {
    e.preventDefault()
    setForgotMessage('')
    setForgotSending(true)
    try {
      const res = await forgotPassword(forgotUsername)
      setForgotMessage(res.message)
    } catch (err) {
      setForgotMessage(err.message)
    } finally {
      setForgotSending(false)
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

          {location.state?.message && <p className="login-success">{location.state.message}</p>}

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

            {unverified && (
              <div className="login-inline-action">
                <button type="button" className="settings-inline-link" onClick={handleResend}>
                  Resend verification email
                </button>
                {resendMessage && <p className="settings-hint">{resendMessage}</p>}
              </div>
            )}

            <button
              type="button"
              className="login-forgot"
              onClick={() => setForgotOpen((v) => !v)}
            >
              Forgot password?
            </button>

            {forgotOpen && (
              <div className="login-forgot-panel">
                <label className="field">
                  <IconMail />
                  <input
                    type="text"
                    placeholder="Your username"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn-secondary btn-block"
                  onClick={handleForgotSubmit}
                  disabled={forgotSending || !forgotUsername.trim()}
                >
                  {forgotSending ? 'Sending…' : 'Email me a reset link'}
                </button>
                {forgotMessage && <p className="settings-hint">{forgotMessage}</p>}
              </div>
            )}

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
            No account yet? <Link to="/signup">Sign up</Link> · or{' '}
            <Link to="/">plan a hangout without one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
