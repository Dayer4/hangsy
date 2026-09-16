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

export async function register({ username, email, fullName, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      email,
      full_name: fullName,
      password,
      hangout_ids: [],
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Registration failed')
  }

  return response.json()
}

function authHeaders() {
  const token = localStorage.getItem('hangsy_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getMe() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Not logged in')
  return response.json()
}

export async function getMyHangouts() {
  const response = await fetch(`${API_BASE_URL}/hangouts/mine`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Could not load your hangouts')
  return response.json()
}

export async function createHangout(hangout) {
  const response = await fetch(`${API_BASE_URL}/hangouts/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(hangout),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Could not create hangout')
  }
  return response.json()
}

export async function getHangout(hangoutId) {
  const response = await fetch(`${API_BASE_URL}/hangouts/${hangoutId}`)
  if (!response.ok) throw new Error('Hangout not found')
  return response.json()
}

export async function getItems(hangoutId) {
  const response = await fetch(`${API_BASE_URL}/items/?hangout_id=${hangoutId}`)
  if (!response.ok) throw new Error('Could not load items')
  return response.json()
}

export async function createItem(item) {
  const response = await fetch(`${API_BASE_URL}/items/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(item),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Could not add item')
  }
  return response.json()
}

export async function updateItem(itemId, updates) {
  const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Could not update item')
  }
  return response.json()
}

export async function deleteItem(itemId) {
  const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Could not delete item')
}

// Returns [] (rather than throwing) if Kroger isn't configured (501) or the
// query is too short, so the UI can just show "no suggestions" either way.
export async function suggestItems(query) {
  if (!query || query.length < 2) return []
  const response = await fetch(`${API_BASE_URL}/items/suggest?q=${encodeURIComponent(query)}`)
  if (!response.ok) return []
  return response.json()
}

export async function getPickups(hangoutId) {
  const response = await fetch(`${API_BASE_URL}/pickups/?hangout_id=${hangoutId}`)
  if (!response.ok) throw new Error('Could not load pickups')
  return response.json()
}

export async function getStores(hangoutId) {
  const response = await fetch(`${API_BASE_URL}/stores/?hangout_id=${hangoutId}`)
  if (!response.ok) throw new Error('Could not load stores')
  return response.json()
}

// Returns null (not an error) if the user hasn't saved a vehicle yet.
export async function getMyDriver() {
  const response = await fetch(`${API_BASE_URL}/drivers/me`, {
    headers: authHeaders(),
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error('Could not load your vehicle')
  return response.json()
}

export async function saveMyDriver(driver) {
  const response = await fetch(`${API_BASE_URL}/drivers/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(driver),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Could not save your vehicle')
  }
  return response.json()
}

export async function createStore(store) {
  const response = await fetch(`${API_BASE_URL}/stores/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(store),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Could not create store')
  }
  return response.json()
}

export async function getCalendarStatus() {
  const response = await fetch(`${API_BASE_URL}/calendar/status`, {
    headers: authHeaders(),
  })
  if (!response.ok) return { connected: false }
  return response.json()
}

// Returns the Google consent URL to navigate to — doesn't navigate itself,
// since this fetch call is what carries the auth token; a raw browser
// navigation to the backend couldn't include it.
export async function getCalendarConnectUrl() {
  const response = await fetch(`${API_BASE_URL}/calendar/connect`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Could not start Google Calendar connection')
  }
  const data = await response.json()
  return data.url
}

export async function getGoogleCalendarEvents(year, month) {
  const response = await fetch(
    `${API_BASE_URL}/calendar/events?year=${year}&month=${month}`,
    { headers: authHeaders() }
  )
  if (!response.ok) return [] // not connected, or a fetch error — either way, show none rather than erroring the page
  return response.json()
}

export async function disconnectCalendar() {
  const response = await fetch(`${API_BASE_URL}/calendar/disconnect`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Could not disconnect')
}
