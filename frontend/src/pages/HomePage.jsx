import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCart, IconCalendar, IconChevronRight, IconPlus } from '../components/icons.jsx'
import { getMe, getMyHangouts } from '../lib/api.js'
import NewHangoutModal from '../components/NewHangoutModal.jsx'
import HangoutDetailModal from '../components/HangoutDetailModal.jsx'

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
  const navigate = useNavigate()

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

  const next = hangouts[0]

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

      <div className="dashboard-grid">
        <div className="dashboard-main">
          {next ? (
            <div className="hero-card">
              <div className="hero-card-label">NEXT HANGOUT</div>
              <div className="hero-card-title">
                {next.emoji ? `${next.emoji} ` : ''}
                {next.hangout_name}
              </div>
              <div className="hero-card-meta">{formatDate(next.hangout_date)} · {next.attendees}</div>
            </div>
          ) : (
            !loading && (
              <div className="hero-card">
                <div className="hero-card-title">No hangouts yet</div>
                <div className="hero-card-meta">Create your first one to get started.</div>
              </div>
            )
          )}

          <div className="module-grid">
            <ModuleCard
              icon={<IconCart />}
              tone="mint"
              title="Shopping list"
              subtitle={next ? `Open ${next.hangout_name}'s list` : 'Add a hangout first'}
              onClick={() => next && navigate(`/hangouts/${next.hangout_id}/shopping`)}
              disabled={!next}
            />
            <ModuleCard
              icon={<IconCalendar />}
              tone="periwinkle"
              title="Calendar"
              subtitle="See every hangout by date"
              onClick={() => navigate('/calendar')}
            />
          </div>
        </div>

        <aside className="dashboard-side">
          <div className="side-card">
            <div className="side-card-title">All your hangouts</div>
            {hangouts.length > 0 ? (
              <HangoutCarousel hangouts={hangouts} onSelect={setSelectedHangout} />
            ) : (
              <p className="muted" style={{ fontSize: 13.5 }}>Nothing here yet.</p>
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

// Auto-scrolls through hangouts on a CSS loop; pauses on hover so it's
// actually readable if you want to stop and look.
function HangoutCarousel({ hangouts, onSelect }) {
  const looped = [...hangouts, ...hangouts] // duplicated so the scroll loop is seamless

  return (
    <div className="carousel-viewport">
      <div className="carousel-track" style={{ '--item-count': hangouts.length }}>
        {looped.map((h, i) => (
          <button
            className="carousel-card"
            key={`${h.hangout_id}-${i}`}
            type="button"
            onClick={() => onSelect(h)}
          >
            <span className="carousel-emoji">{h.emoji || '📅'}</span>
            <div>
              <div className="upcoming-name">{h.hangout_name}</div>
              <div className="upcoming-date">{formatDate(h.hangout_date)}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ModuleCard({ icon, tone, title, subtitle, onClick, disabled }) {
  return (
    <button type="button" className={`module-card tone-${tone}`} onClick={onClick} disabled={disabled}>
      <span className="module-icon">{icon}</span>
      <span className="module-text">
        <span className="module-title">{title}</span>
        <span className="module-subtitle">{subtitle}</span>
      </span>
      <IconChevronRight className="module-chevron" />
    </button>
  )
}
