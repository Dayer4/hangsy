import { IconCart, IconCar, IconChevronRight, IconPlus } from '../components/icons.jsx'

const upcoming = [
  { name: 'Lake House Weekend', date: 'Sat, Sept 12' },
  { name: 'Game Night', date: 'Sat, Sept 19' },
  { name: 'Beach Cleanup + BBQ', date: 'Sun, Oct 4' },
]

export default function HomePage() {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Hey Yaonge</h1>
          <p className="muted">Here's what's coming up.</p>
        </div>
        <button type="button" className="btn-primary">
          <IconPlus /> New hangout
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="hero-card">
            <div className="hero-card-label">NEXT HANGOUT</div>
            <div className="hero-card-title">Lake House Weekend</div>
            <div className="hero-card-meta">Sat, Sept 12 · 6 going · 2 drivers assigned</div>

            <div className="hero-progress">
              <div className="hero-progress-row">
                <span>Shopping list</span>
                <span>8 / 12 packed</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '66%' }} />
              </div>
            </div>
          </div>

          <div className="module-grid">
            <ModuleCard
              icon={<IconCart />}
              tone="mint"
              title="Shopping list"
              subtitle="3 stores · 5 items still needed"
            />
            <ModuleCard
              icon={<IconCar />}
              tone="periwinkle"
              title="Routes"
              subtitle="2 drivers · you're picking up 3"
            />
          </div>
        </div>

        <aside className="dashboard-side">
          <div className="side-card">
            <div className="side-card-title">This week</div>
            <ul className="upcoming-list">
              {upcoming.map((h) => (
                <li key={h.name}>
                  <span className="upcoming-name">{h.name}</span>
                  <span className="upcoming-date">{h.date}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ModuleCard({ icon, tone, title, subtitle }) {
  return (
    <button type="button" className={`module-card tone-${tone}`}>
      <span className="module-icon">{icon}</span>
      <span className="module-text">
        <span className="module-title">{title}</span>
        <span className="module-subtitle">{subtitle}</span>
      </span>
      <IconChevronRight className="module-chevron" />
    </button>
  )
}
