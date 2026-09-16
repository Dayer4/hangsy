import { useState, useEffect } from 'react'
import { IconCar, IconChevronDown } from '../components/icons.jsx'
import { getMe, getMyDriver, saveMyDriver } from '../lib/api.js'

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [vehicleOpen, setVehicleOpen] = useState(false)
  const [vehicle, setVehicle] = useState({
    driver_name: '',
    capacity: '',
    license_plate: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getMe().then(setUser).catch(() => {})
    getMyDriver()
      .then((driver) => {
        if (driver) {
          setVehicle({
            driver_name: driver.driver_name || '',
            capacity: driver.capacity ?? '',
            license_plate: driver.license_plate || '',
            notes: driver.notes || '',
          })
        }
      })
      .catch(() => {})
  }, [])

  function updateVehicle(field, value) {
    setSaved(false)
    setVehicle((v) => ({ ...v, [field]: value }))
  }

  async function handleSaveVehicle(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await saveMyDriver({
        driver_name: vehicle.driver_name,
        capacity: parseInt(vehicle.capacity, 10) || 1,
        license_plate: vehicle.license_plate || null,
        notes: vehicle.notes || null,
      })
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Could not save your vehicle')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-layout">
      <h1>Settings</h1>

      <div className="settings-grid">
        <aside className="settings-sidebar">
          <div className="settings-profile">
            <span className="navbar-avatar">
              {user ? user.full_name.charAt(0).toUpperCase() : '?'}
            </span>
            <div>
              <div className="settings-profile-name">{user?.full_name || 'Loading…'}</div>
              <div className="settings-profile-email">{user?.email || ''}</div>
            </div>
          </div>
        </aside>

        <div className="settings-content">
          <section className="settings-group">
            <h2>Preferences</h2>
            <div className="settings-card">
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
                <form className="settings-expand" onSubmit={handleSaveVehicle}>
                  <label className="settings-field">
                    <span>Vehicle name</span>
                    <input
                      type="text"
                      placeholder="e.g. Mom's Honda CR-V"
                      value={vehicle.driver_name}
                      onChange={(e) => updateVehicle('driver_name', e.target.value)}
                      required
                    />
                  </label>

                  <label className="settings-field">
                    <span>Seat capacity</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 4"
                      value={vehicle.capacity}
                      onChange={(e) => updateVehicle('capacity', e.target.value)}
                      required
                    />
                  </label>

                  <label className="settings-field">
                    <span>License plate (optional)</span>
                    <input
                      type="text"
                      value={vehicle.license_plate}
                      onChange={(e) => updateVehicle('license_plate', e.target.value)}
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
                    Seat capacity feeds into route assignment as a constraint
                    on how many pickups this vehicle can take.
                  </p>

                  {error && <p className="login-error">{error}</p>}

                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save vehicle'}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
