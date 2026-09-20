import { useRef, useState } from 'react'
import { uploadImage, IMAGE_UPLOAD_CONFIGURED } from '../lib/upload.js'

// Drag-and-drop (or click-to-browse) image upload, used for both a
// hangout's cover image and a user's profile picture. Uploads straight to
// Cloudinary's free tier (see lib/upload.js) — if that isn't configured,
// falls back to a plain "paste a URL" field instead of pretending to work.
export default function ImageDropzone({ value, onChange, shape = 'rect', label }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  async function handleFile(file) {
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const url = await uploadImage(file)
      onChange(url)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (!IMAGE_UPLOAD_CONFIGURED) {
    return (
      <div className={`dropzone dropzone-${shape} dropzone-url-only`}>
        {value && <img src={value} alt="" className="dropzone-preview" />}
        <input
          type="url"
          placeholder="Paste an image URL (drag-and-drop upload isn't configured)"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    )
  }

  return (
    <div
      className={`dropzone dropzone-${shape} ${dragging ? 'dropzone-active' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFile(e.dataTransfer.files?.[0])
      }}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value && <img src={value} alt="" className="dropzone-preview" />}
      <div className="dropzone-hint">
        {uploading
          ? 'Uploading…'
          : value
          ? 'Drop a new image, or click to replace'
          : label || 'Drag an image here, or click to browse'}
      </div>
      {error && <p className="dropzone-error">{error}</p>}
    </div>
  )
}
