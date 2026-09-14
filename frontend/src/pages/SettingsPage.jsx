import {
  IconStore,
  IconCard,
  IconBell,
  IconCar,
  IconHelp,
  IconShield,
  IconChevronRight,
  IconLogout,
} from '../components/icons.jsx'

const groups = [
  {
    id: 'account',
    label: 'Account',
    rows: [
      { icon: IconStore, text: 'Connected stores' },
      { icon: IconCard, text: 'Payment & splitting' },
    ],
  },
  {
    id: 'preferences',
    label: 'Preferences',
    rows: [
      { icon: IconBell, text: 'Notifications' },
      { icon: IconCar, text: 'Default vehicle' },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    rows: [
      { icon: IconHelp, text: 'Help & feedback' },
      { icon: IconShield, text: 'Privacy' },
    ],
  },
]

export default function SettingsPage() {
  return (
    <div className="settings-layout">
      <h1>Settings</h1>

      <div className="settings-grid">
        <aside className="settings-sidebar">
          <div className="settings-profile">
            <span className="navbar-avatar">Y</span>
            <div>
              <div className="settings-profile-name">Yaonge Choi</div>
              <div className="settings-profile-email">yaonge@email.com</div>
            </div>
          </div>

          <nav className="settings-nav">
            {groups.map((g) => (
              <a key={g.id} href={`#${g.id}`}>
                {g.label}
              </a>
            ))}
          </nav>

          <button type="button" className="btn-secondary btn-block settings-logout">
            <IconLogout /> Log out
          </button>
        </aside>

        <div className="settings-content">
          {groups.map((g) => (
            <section key={g.id} id={g.id} className="settings-group">
              <h2>{g.label}</h2>
              <div className="settings-card">
                {g.rows.map((r) => (
                  <button type="button" key={r.text} className="settings-row">
                    <r.icon />
                    <span>{r.text}</span>
                    <IconChevronRight className="module-chevron" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
