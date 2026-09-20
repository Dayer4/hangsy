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
import MonthGrid from '../components/MonthGrid.jsx'

function toICSDate(dateInt) {
  return `${dateInt}` // YYYYMMDD is already valid as an ICS all-day DTSTART value
}

// Downloads a .ics file (the standard calendar-import format most calendar
// apps — Google, Apple, Outlook — can open) so hangouts show up in whatever
// calendar someone already uses, with no OAuth or account connection needed.
function exportToICS(hangouts) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hangsy//EN']

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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Calendar</h1>
          <p className="muted">Every hangout, by date.</p>
        </div>
        <div className="dashboard-header-actions">
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

      <MonthGrid
        hangouts={hangouts}
        googleEvents={googleEvents}
        cursor={cursor}
        onCursorChange={setCursor}
        onSelectHangout={setSelectedHangout}
      />

      {!connected && (
        <p className="muted calendar-google-hint">
          Connect Google Calendar to see your other events alongside hangsy's hangouts — hangsy never
          needs this to work, it's purely additive.
        </p>
      )}

      {selectedHangout && <HangoutDetailModal hangout={selectedHangout} onClose={() => setSelectedHangout(null)} />}
    </div>
  )
}
