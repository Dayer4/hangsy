import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconPlus } from '../components/icons.jsx'
import { getMe, getMyHangouts } from '../lib/api.js'
import NewHangoutModal from '../components/NewHangoutModal.jsx'
import HangoutDetailModal from '../components/HangoutDetailModal.jsx'
import MonthGrid from '../components/MonthGrid.jsx'
import TodoList from '../components/TodoList.jsx'

function formatDate(dateInt) {
  const s = String(dateInt)
  if (s.length !== 8) return s
  const date = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`)
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [hangouts, setHangouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedHangout, setSelectedHangout] = useState(null)
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  async function refresh() {
    const [me, mine] = await Promise.all([getMe(), getMyHangouts()])
    setUser(me)
    setHangouts(mine)
  }

  useEffect(() => {
    refresh()
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Soonest-first, so the scrollable list on the side reads like a real
  // upcoming-hangouts queue rather than creation order.
  const sorted = [...hangouts].sort((a, b) => a.hangout_date - b.hangout_date)

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Hey{user ? ` ${user.full_name.split(' ')[0]}` : ''}</h1>
          <p className="muted">Here's what's coming up.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          <IconPlus /> New hangout
        </button>
      </div>

      <div className="home-grid">
        <div className="home-main">
          <div className="home-panel-title-row">
            <span className="home-panel-title">This month</span>
            <Link to="/calendar" className="home-panel-link">
              Full calendar
            </Link>
          </div>
          <MonthGrid
            hangouts={hangouts}
            cursor={cursor}
            onCursorChange={setCursor}
            onSelectHangout={setSelectedHangout}
            compact
          />
        </div>

        <aside className="home-side">
          <TodoList />

          <div className="side-card">
            <div className="side-card-title">All your hangouts</div>
            {loading ? null : sorted.length > 0 ? (
              <ul className="hangout-scroll-list">
                {sorted.map((h) => (
                  <li key={h.hangout_id}>
                    <button type="button" className="hangout-row" onClick={() => setSelectedHangout(h)}>
                      <span className="hangout-row-emoji">{h.emoji || '📅'}</span>
                      <span className="hangout-row-text">
                        <span className="hangout-row-name">{h.hangout_name}</span>
                        <span className="hangout-row-date">{formatDate(h.hangout_date)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted todo-empty">No hangouts yet — create your first one.</p>
            )}
          </div>
        </aside>
      </div>

      {selectedHangout && (
        <HangoutDetailModal hangout={selectedHangout} onClose={() => setSelectedHangout(null)} />
      )}

      {modalOpen && user && (
        <NewHangoutModal
          currentUser={user}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false)
            refresh()
          }}
        />
      )}
    </div>
  )
}
