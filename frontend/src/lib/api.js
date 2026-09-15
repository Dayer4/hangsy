export const API_BASE_URL = 'http://localhost:8000'

// Throws an Error with a readable message on failure (401, network, etc.)
export async function login(username, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Login failed')
  }

  return response.json() // { access_token, token_type }
}

// credential is the ID token Google's Identity Services button hands back
// via its callback (response.credential) — a signed JWT from Google, not a
// password. The backend verifies it itself before trusting anything in it.
export async function loginWithGoogle(credential) {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Google sign-in failed')
  }

  return response.json()
}
