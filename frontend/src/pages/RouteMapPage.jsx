import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getHangout, getPickups } from '../lib/api.js'

// Leaflet's default marker icons reference image files by a path that
// doesn't resolve correctly through Vite's bundler — this rewires them to
// load from a CDN instead. Cosmetic only, doesn't affect map functionality.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function RouteMapPage() {
  const { hangoutId } = useParams()
  const [hangout, setHangout] = useState(null)
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [h, pickups] = await Promise.all([
        getHangout(hangoutId),
        getPickups(hangoutId),
      ])
      if (cancelled) return
      setHangout(h)

      const map = L.map(mapContainerRef.current).setView(
        [h.hangout_location_lat || 0, h.hangout_location_lng || 0],
        12
      )
      mapRef.current = map

      // OpenStreetMap tiles — free, open-source, no API key required.
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      L.marker([h.hangout_location_lat, h.hangout_location_lng])
        .addTo(map)
        .bindPopup(`🎯 ${h.hangout_name} (destination)`)

      const bounds = [[h.hangout_location_lat, h.hangout_location_lng]]
      pickups.forEach((p) => {
        L.marker([p.location_lat, p.location_lng])
          .addTo(map)
          .bindPopup(p.pickup_name)
        bounds.push([p.location_lat, p.location_lng])
      })

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40] })
      }
    }

    load()

    return () => {
      cancelled = true
      mapRef.current?.remove()
    }
  }, [hangoutId])

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>{hangout ? `${hangout.emoji || ''} ${hangout.hangout_name} — route` : 'Route'}</h1>
          <p className="muted">Free OpenStreetMap view — no driver-splitting logic shown here yet.</p>
        </div>
        <Link to="/" className="btn-secondary">Back home</Link>
      </div>

      <div ref={mapContainerRef} className="route-map" />
    </div>
  )
}
