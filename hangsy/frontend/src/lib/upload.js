const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const IMAGE_UPLOAD_CONFIGURED = Boolean(CLOUD_NAME && UPLOAD_PRESET)

// Uploads directly from the browser to Cloudinary's free tier — no backend
// involved, since "unsigned" upload presets are designed for exactly this.
// Returns the hosted image URL, or throws if it's not configured/fails.
export async function uploadImage(file) {
  if (!IMAGE_UPLOAD_CONFIGURED) {
    throw new Error('Image upload is not configured (see Settings > .env)')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) {
    throw new Error('Image upload failed')
  }

  const data = await response.json()
  return data.secure_url
}
