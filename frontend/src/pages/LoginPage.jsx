import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconMail, IconLock, IconEye, IconEyeOff, IconCar } from '../components/icons.jsx'

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false)

  return (
    <div className="login-split">
      <div className="login-brand-panel">
        <div className="login-brand-mark">
          <IconCar />
        </div>
        <div className="login-brand-title">Hangsy</div>
        <p className="login-brand-copy">
          Coordinate who's buying what, and who's driving whom, without the group chat spiral.
        </p>
      </div>

      <div className="login-form-panel">
        <div className="login-form-wrap">
          <h1>Welcome back</h1>
          <p className="muted">Plan the next one.</p>

          <form className="login-form" onSubmit={(e) => e.preventDefault()}>
            <label className="field">
              <IconMail />
              <input type="email" placeholder="Email" autoComplete="email" />
            </label>

            <label className="field">
              <IconLock />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                autoComplete="current-password"
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

            <div className="login-forgot">Forgot password?</div>

            <button type="submit" className="btn-primary btn-block">
              Log in
            </button>
          </form>

          <div className="divider">
            <span />
            <span>or</span>
            <span />
          </div>

          <button type="button" className="btn-secondary btn-block">
            Continue with Google
          </button>

          <p className="login-footer">
            New here? <Link to="/">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
