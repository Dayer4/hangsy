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
