import { useNavigate } from 'react-router-dom'
import { IconCart, IconCar } from './icons.jsx'

export default function HangoutDetailModal({ hangout, onClose }) {
  const navigate = useNavigate()

  function go(path) {
    onClose()
    navigate(path)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{hangout.emoji} {hangout.hangout_name}</h2>
        <p className="muted">{hangout.attendees}</p>

        <div className="modal-form">
          <button
            type="button"
            className="module-card tone-mint"
            onClick={() => go(`/hangouts/${hangout.hangout_id}/shopping`)}
          >
            <span className="module-icon"><IconCart /></span>
            <span className="module-text">
              <span className="module-title">Shopping list</span>
              <span className="module-subtitle">Items, stores, and who's buying what</span>
            </span>
          </button>

          <button
            type="button"
            className="module-card tone-periwinkle"
            onClick={() => go(`/hangouts/${hangout.hangout_id}/route`)}
          >
            <span className="module-icon"><IconCar /></span>
            <span className="module-text">
              <span className="module-title">Route map</span>
              <span className="module-subtitle">See pickup stops on a map</span>
            </span>
          </button>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
