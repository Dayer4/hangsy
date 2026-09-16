import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getMyHangouts,
  getCalendarStatus,
  getCalendarConnectUrl,
  getGoogleCalendarEvents,
  disconnectCalendar,
} from '../lib/api.js'
import HangoutDetailModal from '../components/HangoutDetailModal.jsx'

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function toICSDate(dateInt) {
  return `${dateInt}` // YYYYMMDD is already valid as an ICS all-day DTSTART value
}

function exportToICS(hangouts) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hangsy//EN',
  ]

  for (const h of hangouts) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:hangout-${h.hangout_id}@hangsy`,
      `DTSTART;VALUE=DATE:${toICSDate(h.hangout_date)}`,
      `SUMMARY:${h.emoji ? h.emoji + ' ' : ''}${h.hangout_name}`,
      `DESCRIPTION:${(h.hangout_description || '').replace(/\n/g, '\\n')}`,
      'END:VEVENT'
    )
  }

  lines.push('END:VCALENDAR')

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'hangsy-hangouts.ics'
  a.click()
  URL.revokeObjectURL(url)
}

export default function CalendarPage() {
  const [params] = useSearchParams()
  const [hangouts, setHangouts] = useState([])
  const [googleEvents, setGoogleEvents] = useState([])
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [selectedHangout, setSelectedHangout] = useState(null)
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  useEffect(() => {
    getMyHangouts().then(setHangouts).catch(() => {})
    getCalendarStatus().then((s) => setConnected(s.connected)).catch(() => {})
  }, [])

  // If we just came back from Google's consent screen (?connected=1),
  // re-check status once more — the redirect already happened, this just
  // confirms it and drops the query param from the address bar mentally.
  useEffect(() => {
    if (params.get('connected') === '1') {
      getCalendarStatus().then((s) => setConnected(s.connected)).catch(() => {})
    }
  }, [params])

  useEffect(() => {
    if (!connected) {
      setGoogleEvents([])
      return
    }
    getGoogleCalendarEvents(cursor.year, cursor.month + 1).then(setGoogleEvents)
  }, [connected, cursor])

  async function handleConnect() {
    setConnecting(true)
    try {
      const url = await getCalendarConnectUrl()
      window.location.href = url
    } catch (err) {
      setConnecting(false)
      alert(err.message)
    }
  }

  async function handleDisconnect() {
    await disconnectCalendar()
    setConnected(false)
  }

  const hangoutsByDay = {}
  for (const h of hangouts) {
    const s = String(h.hangout_date)
    if (s.length !== 8) continue
    const y = parseInt(s.slice(0, 4), 10)
    const m = parseInt(s.slice(4, 6), 10) - 1
    const d = parseInt(s.slice(6, 8), 10)
    if (y === cursor.year && m === cursor.month) {
      hangoutsByDay[d] = [...(hangoutsByDay[d] || []), h]
    }
  }

  const googleEventsByDay = {}
  for (const e of googleEvents) {
    if (!e.start) continue
    const d = parseInt(e.start.slice(8, 10), 10)
    googleEventsByDay[d] = [...(googleEventsByDay[d] || []), e]
  }

  const total = daysInMonth(cursor.year, cursor.month)
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay()
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)]

  function shiftMonth(delta) {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Calendar</h1>
          <p className="muted">Every hangout, by date.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn-secondary" onClick={() => exportToICS(hangouts)}>
            Export .ics
          </button>
          {connected ? (
            <button type="button" className="btn-secondary" onClick={handleDisconnect}>
              Disconnect Google Calendar
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={handleConnect} disabled={connecting}>
              {connecting ? 'Redirecting…' : 'Connect Google Calendar'}
            </button>
          )}
        </div>
      </div>

      <div className="calendar-nav">
        <button type="button" className="btn-secondary" onClick={() => shiftMonth(-1)}>←</button>
        <span className="calendar-month-label">{monthLabel}</span>
        <button type="button" className="btn-secondary" onClick={() => shiftMonth(1)}>→</button>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="calendar-weekday">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className={`calendar-cell ${day ? '' : 'calendar-cell-empty'}`}>
            {day && (
              <>
                <span className="calendar-day-number">{day}</span>
                {(hangoutsByDay[day] || []).map((h) => (
                  <button
                    key={h.hangout_id}
                    type="button"
                    className="calendar-tab"
                    onClick={() => setSelectedHangout(h)}
                  >
                    {h.emoji} {h.hangout_name}
                  </button>
                ))}
                {(googleEventsByDay[day] || []).map((e, i) => (
                  <span key={i} className="calendar-tab calendar-tab-google" title={e.summary}>
                    {e.summary}
                  </span>
                ))}
              </>
            )}
          </div>
        ))}
      </div>

      {!connected && (
        <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
          Connect Google Calendar to see your other events alongside hangsy's
          hangouts — hangsy never needs this to work, it's purely additive.
        </p>
      )}

      {selectedHangout && (
        <HangoutDetailModal hangout={selectedHangout} onClose={() => setSelectedHangout(null)} />
      )}
    </div>
  )
}
