import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconLock } from '../components/icons.jsx'
import EmojiPicker from '../components/EmojiPicker.jsx'

export default function DraftHangoutPage() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState({
    name: '',
    date: '',
    description: '',
    attendees: '',
    emoji: '🎉',
    imageUrl: '',
  })

  function update(field, value) {
    setDraft((d) => ({ ...d, [field]: value }))
  }

  return (
    <div className="draft-layout">
      <div className="draft-intro">
        <h1>Plan a hangout</h1>
        <p className="muted">
          Sketch it out here. Log in to save it, invite people, and start the
          shopping list and routes.
        </p>
      </div>

      <div className="draft-card">
        <label className="settings-field">
          <span>Icon</span>
          <EmojiPicker value={draft.emoji} onChange={(emoji) => update('emoji', emoji)} />
        </label>

        <label className="settings-field">
          <span>Hangout name</span>
          <input
            type="text"
            placeholder="Lake House Weekend"
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </label>

        <label className="settings-field">
          <span>Date</span>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => update('date', e.target.value)}
          />
        </label>

        <label className="settings-field">
          <span>Description</span>
          <input
            type="text"
            placeholder="What's the plan?"
            value={draft.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </label>

        <label className="settings-field">
          <span>Who's coming</span>
          <input
            type="text"
            placeholder="Alice, Bob, Carol"
            value={draft.attendees}
            onChange={(e) => update('attendees', e.target.value)}
          />
        </label>

        <button
          type="button"
          className="btn-primary btn-block"
          onClick={() => navigate('/login')}
        >
          <IconLock /> Log in to save this hangout
        </button>
        <p className="draft-note">Nothing here is saved until you log in.</p>
      </div>
    </div>
  )
}
