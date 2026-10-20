import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  getHangout,
  getPickups,
  getHangoutRoutes,
  assignRoutes,
  getAllDrivers,
} from '../lib/api.js'

// Same free public OSRM demo server the backend defaults to
// (see backend/app/services/osrm.py) — used here purely to fetch a route's
// real road geometry for drawing, not for solving anything. If this is
// ever pointed at a self-hosted instance, update both places.
const OSRM_BASE_URL = 'https://router.project-osrm.org'

const ROUTE_COLORS = ['#5b5fef', '#1fae8e', '#ffb648', '#e0607e', '#2f9bd6', '#9a6bd1']

// OSRM wants "lon,lat" — the reverse of everywhere else in this app.
async function fetchRoadGeometry(coordinates) {
  const coordStr = coordinates.map(([lat, lng]) => `${lng},${lat}`).join(';')
  try {
    const response = await fetch(
      `${OSRM_BASE_URL}/route/v1/driving/${coordStr}?overview=full&geometries=geojson`
    )
    if (!response.ok) return null
    const data = await response.json()
    if (data.code !== 'Ok' || !data.routes?.[0]) return null
    return {
      // GeoJSON is [lng, lat]; Leaflet wants [lat, lng] — swap back.
      path: data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanceMeters: data.routes[0].distance,
      durationSeconds: data.routes[0].duration,
    }
  } catch {
    return null
  }
}

function formatDistance(meters) {
  const miles = meters / 1609.34
  return `${miles.toFixed(1)} mi`
}

function formatDuration(seconds) {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

// Only raw `leaflet` is installed here (no react-leaflet wrapper), so the
// map is built imperatively: one Leaflet map instance lives for the life
// of this component (first effect), and markers/lines are redrawn onto it
// whenever the data changes (second effect) rather than recreating the
// map itself, which would flash/reset the view on every refresh.
function RouteLeafletMap({ destination, stops, lines }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = L.map(containerRef.current)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !destination) return

    const layerGroup = L.layerGroup().addTo(map)

    L.circleMarker([destination.lat, destination.lng], {
      radius: 9,
      color: '#201d2b',
      weight: 2,
      fillColor: '#201d2b',
      fillOpacity: 1,
    })
      .bindPopup(destination.label)
      .addTo(layerGroup)

    for (const stop of stops) {
      L.circleMarker([stop.lat, stop.lng], {
        radius: 8,
        color: stop.color,
        weight: 2,
        fillColor: stop.color,
        fillOpacity: 0.85,
      })
        .bindPopup(stop.label)
        .addTo(layerGroup)
    }

    for (const line of lines) {
      L.polyline(line.path, { color: line.color, weight: 4, opacity: 0.75 }).addTo(layerGroup)
    }

    const allPoints = [[destination.lat, destination.lng], ...stops.map((s) => [s.lat, s.lng])]
    map.fitBounds(allPoints, { padding: [40, 40] })

    return () => layerGroup.remove()
  }, [destination, stops, lines])

  return <div ref={containerRef} className="route-leaflet-map" />
}

export default function RouteMapPage() {
  const { hangoutId } = useParams()
  const [hangout, setHangout] = useState(null)
  const [pickups, setPickups] = useState([])
  const [routes, setRoutes] = useState([])
  const [drivers, setDrivers] = useState([])
  const [drawnRoutes, setDrawnRoutes] = useState([]) // routes + resolved geometry/stats
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const [h, p, r, d] = await Promise.all([
      getHangout(hangoutId),
      getPickups(hangoutId),
      getHangoutRoutes(hangoutId),
      getAllDrivers(),
    ])
    setHangout(h)
    setPickups(p)
    setRoutes(r)
    setDrivers(d)
    return { hangout: h, pickups: p, routes: r }
  }, [hangoutId])

  useEffect(() => {
    refresh()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [refresh])

  // Resolves each route's ordered pickup_ids into real coordinates and
  // fetches its road geometry — kept separate from the main refresh since
  // it depends on pickups/hangout already being loaded, and shouldn't block
  // the map from rendering markers while it's still fetching lines.
  useEffect(() => {
    if (!hangout || pickups.length === 0 || routes.length === 0) {
      setDrawnRoutes([])
      return
    }

    let cancelled = false

    async function buildDrawnRoutes() {
      const built = await Promise.all(
        routes.map(async (route, i) => {
          const stops = route.pickup_ids
            .map((id) => pickups.find((p) => p.pickup_id === id))
            .filter(Boolean) // a stop from a since-deleted store just drops silently

          if (stops.length === 0) return null

          const coordinates = [
            [hangout.hangout_location_lat, hangout.hangout_location_lng],
            ...stops.map((s) => [s.location_lat, s.location_lng]),
          ]

          const geometry = await fetchRoadGeometry(coordinates)

          return {
            route,
            stops,
            color: ROUTE_COLORS[i % ROUTE_COLORS.length],
            path: geometry?.path || coordinates, // straight-line fallback
            distanceMeters: geometry?.distanceMeters ?? null,
            durationSeconds: geometry?.durationSeconds ?? null,
            roadAccurate: Boolean(geometry),
          }
        })
      )

      if (!cancelled) setDrawnRoutes(built.filter(Boolean))
    }

    buildDrawnRoutes()
    return () => {
      cancelled = true
    }
  }, [hangout, pickups, routes])

  async function handleOptimize() {
    setError('')
    setOptimizing(true)
    try {
      await assignRoutes(hangoutId)
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not assign routes')
    } finally {
      setOptimizing(false)
    }
  }

  const assignedPickupIds = new Set(routes.flatMap((r) => r.pickup_ids))
  const unassignedPickups = pickups.filter((p) => !assignedPickupIds.has(p.pickup_id))

  function driverName(driverId) {
    return drivers.find((d) => d.driver_id === driverId)?.driver_name || `Driver #${driverId}`
  }

  if (loading) return <div className="dashboard" />

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>{hangout ? `${hangout.emoji || ''} ${hangout.hangout_name}` : 'Route map'}</h1>
          <p className="muted">
            {pickups.length} stop{pickups.length === 1 ? '' : 's'} · {routes.length} driver
            {routes.length === 1 ? '' : 's'} assigned
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button type="button" className="btn-primary" onClick={handleOptimize} disabled={optimizing}>
            {optimizing ? 'Optimizing…' : 'Optimize routes'}
          </button>
          <Link to={`/hangouts/${hangoutId}/shopping`} className="btn-secondary">
            Back to shopping list
          </Link>
        </div>
      </div>

      {error && <p className="login-error">{error}</p>}

      <div className="route-map-layout">
        <div className="route-map-canvas">
          {hangout && (
            <RouteLeafletMap
              destination={{
                lat: hangout.hangout_location_lat,
                lng: hangout.hangout_location_lng,
                label: hangout.hangout_name,
              }}
              stops={pickups.map((p) => ({
                lat: p.location_lat,
                lng: p.location_lng,
                label: p.pickup_name,
                color: drawnRoutes.find((dr) => dr.route.pickup_ids.includes(p.pickup_id))?.color || '#9a9aa5',
              }))}
              lines={drawnRoutes.map((dr) => ({ path: dr.path, color: dr.color }))}
            />
          )}
        </div>

        <aside className="route-map-sidebar">
          {routes.length === 0 && (
            <p className="muted">
              No routes yet — click "Optimize routes" once at least one saved vehicle and one store
              exist for this hangout.
            </p>
          )}

          {drawnRoutes.map((dr) => (
            <div key={dr.route.route_id} className="route-card" style={{ borderLeftColor: dr.color }}>
              <div className="route-card-header">
                <span className="route-card-swatch" style={{ background: dr.color }} />
                <span className="route-card-driver">{driverName(dr.route.driver_id)}</span>
              </div>
              <ol className="route-card-stops">
                {dr.stops.map((stop) => (
                  <li key={stop.pickup_id}>{stop.pickup_name}</li>
                ))}
              </ol>
              {dr.distanceMeters != null ? (
                <p className="route-card-stats">
                  {formatDistance(dr.distanceMeters)} · {formatDuration(dr.durationSeconds)}
                </p>
              ) : (
                <p className="route-card-stats route-card-stats-fallback">
                  Straight-line estimate — road distance unavailable right now
                </p>
              )}
            </div>
          ))}

          {unassignedPickups.length > 0 && (
            <div className="route-card route-card-unassigned">
              <div className="route-card-header">
                <span className="route-card-swatch" style={{ background: '#9a9aa5' }} />
                <span className="route-card-driver">Not yet assigned</span>
              </div>
              <ol className="route-card-stops">
                {unassignedPickups.map((p) => (
                  <li key={p.pickup_id}>{p.pickup_name}</li>
                ))}
              </ol>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
