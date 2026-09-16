import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { API_BASE_URL } from '../lib/api.js'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState('checking') // checking | ok | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setStatus('error')
      setMessage('No verification token in the link.')
      return
    }

    fetch(`${API_BASE_URL}/auth/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.detail || 'Verification failed')
        setStatus('ok')
        setMessage(body.message)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message)
      })
  }, [params])

  return (
    <div className="draft-layout">
      <div className="draft-card" style={{ textAlign: 'center' }}>
        {status === 'checking' && <p>Verifying…</p>}
        {status === 'ok' && (
          <>
            <h1>You're verified 🎉</h1>
            <p className="muted">{message}</p>
            <Link to="/login" className="btn-primary btn-block">Go to login</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1>Couldn't verify</h1>
            <p className="muted">{message}</p>
            <Link to="/login" className="btn-secondary btn-block">Back to login</Link>
          </>
        )}
      </div>
    </div>
  )
}
