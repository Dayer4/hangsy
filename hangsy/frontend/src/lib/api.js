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

export async function updateMe(updates) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Could not save changes')
  }
  return response.json()
}

export async function changeUsername(username) {
  const response = await fetch(`${API_BASE_URL}/auth/username`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ username }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Could not change username')
  }
  return response.json()
}

export async function resendVerification({ email, username } = {}) {
  const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username }),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.detail || 'Could not resend verification email')
  return body
}

export async function forgotPassword(username) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.detail || 'Could not send reset link')
  return body
}

export async function requestPasswordChange() {
  const response = await fetch(`${API_BASE_URL}/auth/request-password-change`, {
    method: 'POST',
    headers: authHeaders(),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.detail || 'Could not start password change')
  return body
}

export async function confirmPasswordChange(token, newPassword) {
  const response = await fetch(`${API_BASE_URL}/auth/confirm-password-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.detail || 'Could not change password')
  return body
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

export async function getHangoutRoutes(hangoutId) {
  const response = await fetch(`${API_BASE_URL}/routes/by-hangout/${hangoutId}`)
  if (!response.ok) throw new Error('Could not load routes')
  return response.json()
}

export async function assignRoutes(hangoutId) {
  const response = await fetch(`${API_BASE_URL}/routes/assign/${hangoutId}`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Could not assign routes')
  }
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

// All drivers, system-wide — used only to look up a route's driver_id ->
// name for display on the route map. (No per-driver GET endpoint exists
// yet; filtering this client-side is the pragmatic option until one does.)
export async function getAllDrivers() {
  const response = await fetch(`${API_BASE_URL}/drivers/`)
  if (!response.ok) return []
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

export async function deleteStore(storeId) {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Could not remove store')
}

// Returns [] on any failure (too-short query, network hiccup, Nominatim rate
// limit) rather than throwing — an autocomplete dropdown should just show
// nothing rather than an error state.
export async function getAddressSuggestions(query) {
  if (!query || query.trim().length < 3) return []
  const response = await fetch(`${API_BASE_URL}/geocode/suggest?q=${encodeURIComponent(query)}`)
  if (!response.ok) return []
  return response.json()
}

export async function getMyTodos() {
  const response = await fetch(`${API_BASE_URL}/todos/mine`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Could not load your to-dos')
  return response.json()
}

export async function createTodo(text) {
  const response = await fetch(`${API_BASE_URL}/todos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ text }),
  })
  if (!response.ok) throw new Error('Could not add to-do')
  return response.json()
}

export async function updateTodo(todoId, updates) {
  const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(updates),
  })
  if (!response.ok) throw new Error('Could not update to-do')
  return response.json()
}

export async function deleteTodo(todoId) {
  const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Could not delete to-do')
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
