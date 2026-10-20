function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

// The month calendar grid + nav, shared by HomePage (compact, hangouts only)
// and CalendarPage (full-size, plus Google Calendar overlay). Cursor state
// lives in the parent, not here, since CalendarPage needs to know the
// current month to fetch that month's Google events.
export default function MonthGrid({
  hangouts,
  googleEvents = [],
  cursor,
  onCursorChange,
  onSelectHangout,
  compact = false,
}) {
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
    onCursorChange(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === cursor.year && today.getMonth() === cursor.month

  return (
    <div className={`month-grid ${compact ? 'month-grid-compact' : ''}`}>
      <div className="calendar-nav">
        <button type="button" className="calendar-nav-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          ‹
        </button>
        <span className="calendar-month-label">{monthLabel}</span>
        <button type="button" className="calendar-nav-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="calendar-weekday">
            {compact ? d.charAt(0) : d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`calendar-cell ${day ? '' : 'calendar-cell-empty'} ${
              isCurrentMonth && day === today.getDate() ? 'calendar-cell-today' : ''
            }`}
          >
            {day && (
              <>
                <span className="calendar-day-number">{day}</span>
                {(hangoutsByDay[day] || []).map((h) => (
                  <button key={h.hangout_id} type="button" className="calendar-tab" onClick={() => onSelectHangout(h)}>
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
    </div>
  )
}
