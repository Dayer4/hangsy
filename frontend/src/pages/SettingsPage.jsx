import { useState } from 'react'
import { IconBell, IconCar, IconChevronRight, IconChevronDown } from '../components/icons.jsx'

export default function SettingsPage() {
  const [vehicleOpen, setVehicleOpen] = useState(false)
  const [vehicle, setVehicle] = useState({
    name: '',
    seats: '',
    plate: '',
    notes: '',
  })

  function updateVehicle(field, value) {
    setVehicle((v) => ({ ...v, [field]: value }))
  }

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
        </aside>

        <div className="settings-content">
          <section className="settings-group">
            <h2>Preferences</h2>
            <div className="settings-card">
              <button type="button" className="settings-row">
                <IconBell />
                <span>Notifications</span>
                <IconChevronRight className="module-chevron" />
              </button>

              <button
                type="button"
                className="settings-row"
                onClick={() => setVehicleOpen((v) => !v)}
                aria-expanded={vehicleOpen}
              >
                <IconCar />
                <span>Default vehicle</span>
                <IconChevronDown
                  className={`module-chevron ${vehicleOpen ? 'settings-chevron-open' : ''}`}
                />
              </button>

              {vehicleOpen && (
                <div className="settings-expand">
                  <label className="settings-field">
                    <span>Vehicle name</span>
                    <input
                      type="text"
                      placeholder="e.g. Mom's Honda CR-V"
                      value={vehicle.name}
                      onChange={(e) => updateVehicle('name', e.target.value)}
                    />
                  </label>

                  <label className="settings-field">
                    <span>Seat capacity</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 4"
                      value={vehicle.seats}
                      onChange={(e) => updateVehicle('seats', e.target.value)}
                    />
                  </label>

                  <label className="settings-field">
                    <span>License plate (optional)</span>
                    <input
                      type="text"
                      value={vehicle.plate}
                      onChange={(e) => updateVehicle('plate', e.target.value)}
                    />
                  </label>

                  <label className="settings-field">
                    <span>Notes (optional)</span>
                    <input
                      type="text"
                      placeholder="e.g. no trunk space for coolers"
                      value={vehicle.notes}
                      onChange={(e) => updateVehicle('notes', e.target.value)}
                    />
                  </label>

                  <p className="settings-hint">
                    Seat capacity is meant to constrain route assignment (how many
                    pickups this vehicle can take). Not wired to save yet — the
                    backend's Driver model isn't linked to a specific logged-in user
                    yet, so there's nowhere to persist this. Say the word and I'll
                    add that link.
                  </p>

                  <button type="button" className="btn-primary" disabled>
                    Save vehicle
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
