import { useState } from 'react'
import EmojiPicker from './EmojiPicker.jsx'
import { createHangout } from '../lib/api.js'
import { uploadImage, IMAGE_UPLOAD_CONFIGURED } from '../lib/upload.js'

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
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleImageFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setImageUrl(url)
    } catch (err) {
      setError(err.message || 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const created = await createHangout({
        hangout_name: name,
        // TODO: no address/geocoding input yet — see Obsidian To-Do.
        // Hardcoding 0,0 until a location field is wired to services/geocoding.
        hangout_location_lat: 0,
        hangout_location_lng: 0,
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
            {IMAGE_UPLOAD_CONFIGURED ? (
              <>
                <input type="file" accept="image/*" onChange={handleImageFile} />
                {uploading && <span className="muted" style={{ fontSize: 12.5 }}>Uploading…</span>}
                {imageUrl && !uploading && (
                  <img src={imageUrl} alt="Cover preview" className="cover-preview" />
                )}
              </>
            ) : (
              <input
                type="url"
                placeholder="https://... (file upload not configured, paste a URL instead)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            )}
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
