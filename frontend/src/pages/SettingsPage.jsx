import { useState, useEffect } from 'react'
import { IconCar, IconChevronDown, IconLock, IconMail, IconShield, IconUser } from '../components/icons.jsx'
import { getMe, getMyDriver, saveMyDriver, updateMe, changeUsername, resendVerification, requestPasswordChange } from '../lib/api.js'
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

  const [usernameDraft, setUsernameDraft] = useState('')
  const [usernameEditing, setUsernameEditing] = useState(false)
  const [usernameSaving, setUsernameSaving] = useState(false)
  const [usernameError, setUsernameError] = useState('')

  const [resendMessage, setResendMessage] = useState('')
  const [resendSending, setResendSending] = useState(false)

  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSending, setPasswordSending] = useState(false)

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u)
        setEmailDraft(u.email)
        setUsernameDraft(u.username)
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

  async function handleSaveUsername(e) {
    e.preventDefault()
    setUsernameError('')
    setUsernameSaving(true)
    try {
      const updated = await changeUsername(usernameDraft)
      setUser(updated)
      setUsernameEditing(false)
    } catch (err) {
      // Surfaces the backend's own message directly — including the 1-minute
      // cooldown countdown ("Wait 42s before changing your username again").
      setUsernameError(err.message || 'Could not change username')
    } finally {
      setUsernameSaving(false)
    }
  }

  async function handleResendVerification() {
    setResendSending(true)
    setResendMessage('')
    try {
      const res = await resendVerification({ email: user?.email })
      setResendMessage(res.message)
    } catch (err) {
      setResendMessage(err.message || 'Could not resend verification email')
    } finally {
      setResendSending(false)
    }
  }

  async function handleRequestPasswordChange() {
    setPasswordError('')
    setPasswordMessage('')
    setPasswordSending(true)
    try {
      const res = await requestPasswordChange()
      setPasswordMessage(res.message)
    } catch (err) {
      setPasswordError(err.message || 'Could not start password change')
    } finally {
      setPasswordSending(false)
    }
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
                <IconUser />
                <span>Username</span>
                {!usernameEditing && (
                  <button type="button" className="settings-inline-link" onClick={() => setUsernameEditing(true)}>
                    Change
                  </button>
                )}
              </div>

              {usernameEditing ? (
                <form className="settings-expand" onSubmit={handleSaveUsername}>
                  <label className="settings-field">
                    <span>New username</span>
                    <input
                      type="text"
                      value={usernameDraft}
                      onChange={(e) => setUsernameDraft(e.target.value)}
                      required
                    />
                  </label>
                  <p className="settings-hint">
                    Letters, numbers, and underscores only (3–20 characters). No email or
                    password confirmation needed — just a 1-minute cooldown between changes.
                  </p>
                  {usernameError && <p className="login-error">{usernameError}</p>}
                  <div className="modal-actions modal-actions-inline">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setUsernameEditing(false)
                        setUsernameDraft(user?.username || '')
                        setUsernameError('')
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={usernameSaving}>
                      {usernameSaving ? 'Saving…' : 'Save username'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="settings-static-value">@{user?.username}</div>
              )}

              <div className="settings-row settings-row-static settings-row-bordered">
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
                {!user?.is_verified && (
                  <>
                    <button type="button" className="btn-secondary" onClick={handleResendVerification} disabled={resendSending}>
                      {resendSending ? 'Sending…' : 'Resend verification email'}
                    </button>
                    {resendMessage && <p className="settings-hint">{resendMessage}</p>}
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="settings-group">
            <h2>Password</h2>
            <div className="settings-card">
              <div className="settings-row settings-row-static">
                <IconLock />
                <span>Change password</span>
              </div>
              <div className="settings-expand settings-expand-quiet">
                {user?.is_verified ? (
                  <>
                    <p className="settings-hint">
                      We'll email a secure, 30-minute link to {user?.email} to set a new password.
                      Every device you're logged in on — including this one — will need to log in
                      again once it's changed.
                    </p>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleRequestPasswordChange}
                      disabled={passwordSending}
                    >
                      {passwordSending ? 'Sending…' : 'Send password change link'}
                    </button>
                    {passwordMessage && <p className="settings-hint">{passwordMessage}</p>}
                    {passwordError && <p className="login-error">{passwordError}</p>}
                  </>
                ) : (
                  <p className="settings-hint">Verify your email above before you can change your password.</p>
                )}
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
