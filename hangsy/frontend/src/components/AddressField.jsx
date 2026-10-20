import { useEffect, useRef, useState } from 'react'
import { getAddressSuggestions } from '../lib/api.js'

// Text field with a debounced autocomplete dropdown, backed by the free
// OpenStreetMap/Nominatim search already used in services/geocoding.py.
// Nominatim indexes named places (shops, restaurants, landmarks), not just
// street addresses, so this doubles as a "find this business" search —
// that's what lets it be reused for stores, not just a hangout's address.
//
// onSelect receives { lat, lng, label } once someone picks a suggestion.
// onQueryChange (optional) fires on every keystroke, for callers that want
// to treat the raw typed text as a value in its own right (e.g. a store
// name someone types without picking a suggestion at all).
export default function AddressField({
  initialValue = '',
  onSelect,
  onQueryChange,
  placeholder = 'Start typing an address…',
  hint,
  formatSelectedQuery = (suggestion) => suggestion.label,
  formatSuggestionLabel = (suggestion) => suggestion.label,
}) {
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleChange(e) {
    const next = e.target.value
    setQuery(next)
    onQueryChange?.(next)
    setOpen(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const results = await getAddressSuggestions(next)
      // Nominatim can return several real locations that all *display* the
      // same thing (e.g. several Ralphs branches, all shown as just
      // "Ralphs" once the distinguishing address is hidden — see
      // formatSuggestionLabel) — keep only the first result per displayed
      // label so the list doesn't show visually identical rows.
      const seen = new Set()
      const deduped = results.filter((r) => {
        const key = formatSuggestionLabel(r)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      setSuggestions(deduped)
      setLoading(false)
    }, 400)
  }

  function handlePick(suggestion) {
    const displayValue = formatSelectedQuery(suggestion)
    setQuery(displayValue)
    onQueryChange?.(displayValue)
    setOpen(false)
    setSuggestions([])
    onSelect({ lat: suggestion.latitude, lng: suggestion.longitude, label: suggestion.label })
  }

  return (
    <div className="address-field" ref={wrapRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {open && (loading || suggestions.length > 0) && (
        <ul className="address-suggestions">
          {loading && <li className="address-suggestion-loading">Searching…</li>}
          {!loading &&
            suggestions.map((s, i) => (
              <li key={i}>
                <button type="button" onClick={() => handlePick(s)}>
                  {formatSuggestionLabel(s)}
                </button>
              </li>
            ))}
        </ul>
      )}
      {hint !== null && (
        <p className="address-hint">
          {hint ||
            "Free address search (OpenStreetMap) — pick a result to set the map location. Less precise than Google's in rural areas, but no API key needed."}
        </p>
      )}
    </div>
  )
}
