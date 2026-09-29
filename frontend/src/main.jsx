import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/hangsy.css'
import App from './App.jsx'
import { API_BASE_URL } from './lib/api.js'
import { getToken, clearToken } from './lib/auth.js'

// A 401 from our own API now means something specific and expected: the
// token this browser is holding was invalidated (password change bumped
// User.token_version — see routers/auth.py) or has simply expired. Every
// api.js function throws on a non-OK response already, but none of them
// know how to get the person back to a working state — that's a
// cross-cutting concern, so it lives here once instead of in every
// individual fetch call.
const nativeFetch = window.fetch
window.fetch = async (...args) => {
  const response = await nativeFetch(...args)
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url

  if (response.status === 401 && url?.startsWith(API_BASE_URL) && getToken()) {
    clearToken()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  return response
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
