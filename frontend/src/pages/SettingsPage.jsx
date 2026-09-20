import { useState, useEffect } from 'react'
import { IconCar, IconChevronDown, IconMail, IconShield } from '../components/icons.jsx'
import { getMe, getMyDriver, saveMyDriver, updateMe } from '../lib/api.js'
import ImageDropzone from '../components/ImageDropzone.jsx'

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

  const [emailDraft, setEmailDraft] = useState('')
  const [emailEditing, setEmailEditing] = useState(false)
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState('')

  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u)
        setEmailDraft(u.email)
      })
      .catch(() => {})
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

  async function handleProfilePicture(url) {
    const updated = await updateMe({ profile_picture_url: url })
    setUser(updated)
  }

  async function handleSaveEmail(e) {
    e.preventDefault()
    setEmailError('')
    setEmailSaving(true)
    try {
      const updated = await updateMe({ email: emailDraft })
      setUser(updated)
      setEmailEditing(false)
    } catch (err) {
      setEmailError(err.message || 'Could not update email')
    } finally {
      setEmailSaving(false)
    }
  }

  function handleResendVerification() {
    // Placeholder — no backend call yet. Real resend-verification-email
    // logic (rate limiting, a fresh token) isn't wired up; this just shows
    // the UI shape until it is.
    setResendMessage('This will resend a real verification email once that flow is built.')
  }

  return (
    <div className="settings-layout">
      <h1>Settings</h1>

      <div className="settings-grid">
        <aside className="settings-sidebar">
          <div className="settings-profile">
            <ImageDropzone
              value={user?.profile_picture_url}
              onChange={handleProfilePicture}
              shape="circle"
              label="Photo"
            />
            <div>
              <div className="settings-profile-name">{user?.full_name || 'Loading…'}</div>
              <div className="settings-profile-email">{user?.email || ''}</div>
            </div>
          </div>
        </aside>

        <div className="settings-content">
          <section className="settings-group">
            <h2>Account</h2>
            <div className="settings-card">
              <div className="settings-row settings-row-static">
                <IconMail />
                <span>Email</span>
                {!emailEditing && (
                  <button type="button" className="settings-inline-link" onClick={() => setEmailEditing(true)}>
                    Change
                  </button>
                )}
              </div>

              {emailEditing ? (
                <form className="settings-expand" onSubmit={handleSaveEmail}>
                  <label className="settings-field">
                    <span>New email</span>
                    <input
                      type="email"
                      value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)}
                      required
                    />
                  </label>
                  {emailError && <p className="login-error">{emailError}</p>}
                  <div className="modal-actions modal-actions-inline">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setEmailEditing(false)
                        setEmailDraft(user?.email || '')
                        setEmailError('')
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={emailSaving}>
                      {emailSaving ? 'Saving…' : 'Save email'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="settings-static-value">{user?.email}</div>
              )}

              <div className="settings-row settings-row-static settings-row-bordered">
                <IconShield />
                <span>Email verification</span>
                <span className={`verify-badge ${user?.is_verified ? 'verify-badge-ok' : 'verify-badge-pending'}`}>
                  {user?.is_verified ? 'Verified' : 'Not verified'}
                </span>
              </div>
              <div className="settings-expand settings-expand-quiet">
                <p className="settings-hint">
                  {user?.is_verified
                    ? "You're all set — this account's email is confirmed."
                    : 'Verify your email to make sure you can recover your account.'}
                </p>
                <button type="button" className="btn-secondary" onClick={handleResendVerification}>
                  Resend verification email
                </button>
                {resendMessage && <p className="settings-hint">{resendMessage}</p>}
              </div>
            </div>
          </section>

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
