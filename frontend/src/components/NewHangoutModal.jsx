import { useState } from 'react'
import EmojiPicker from './EmojiPicker.jsx'
import AddressField from './AddressField.jsx'
import ImageDropzone from './ImageDropzone.jsx'
import { createHangout } from '../lib/api.js'

function toDateInt(dateString) {
  return parseInt(dateString.replaceAll('-', ''), 10)
}

function todayAsInt() {
  return toDateInt(new Date().toISOString().slice(0, 10))
}

export default function NewHangoutModal({ currentUser, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [attendees, setAttendees] = useState('')
  const [emoji, setEmoji] = useState('🎉')
  const [imageUrl, setImageUrl] = useState('')
  const [location, setLocation] = useState(null) // { lat, lng, label }
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!location) {
      setError('Pick an address from the suggestions so the route map knows where this is.')
      return
    }

    setSubmitting(true)
    try {
      const created = await createHangout({
        hangout_name: name,
        hangout_location_lat: location.lat,
        hangout_location_lng: location.lng,
        hangout_date: toDateInt(date),
        creation_date: todayAsInt(),
        hangout_description: description || null,
        emoji,
        image_url: imageUrl || null,
        attendees,
        creator_id: currentUser.user_id,
      })
      onCreated(created)
    } catch (err) {
      setError(err.message || 'Could not create hangout')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>New hangout</h2>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="settings-field">
            <span>Icon</span>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </label>

          <label className="settings-field">
            <span>Cover image (optional)</span>
            <ImageDropzone value={imageUrl} onChange={setImageUrl} shape="rect" />
          </label>

          <label className="settings-field">
            <span>Name</span>
            <input
              type="text"
              placeholder="Lake House Weekend"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="settings-field">
            <span>Address</span>
            <AddressField onSelect={setLocation} />
            {location && <p className="address-selected">✓ {location.label}</p>}
          </label>

          <label className="settings-field">
            <span>Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <label className="settings-field">
            <span>Description</span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="settings-field">
            <span>Who's coming</span>
            <input
              type="text"
              placeholder="Alice, Bob, Carol"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              required
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create hangout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
