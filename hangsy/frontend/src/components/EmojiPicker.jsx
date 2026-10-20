const EMOJIS = [
  '🎉', '🏖️', '🏕️', '🍔', '🎮', '🎬', '🎂', '🚗',
  '⛰️', '🏀', '🎣', '🍕', '🎨', '🌊', '🔥', '🎳',
]

export default function EmojiPicker({ value, onChange }) {
  return (
    <div className="emoji-picker">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className={`emoji-option ${value === emoji ? 'emoji-option-selected' : ''}`}
          onClick={() => onChange(emoji === value ? '' : emoji)}
          aria-pressed={value === emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
