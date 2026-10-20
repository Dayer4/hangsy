import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getHangout,
  getStores,
  createStore,
  deleteStore,
  getItems,
  createItem,
  updateItem,
  deleteItem,
  suggestItems,
} from '../lib/api.js'
import AddressField from '../components/AddressField.jsx'

export default function ShoppingListPage() {
  const { hangoutId } = useParams()
  const [hangout, setHangout] = useState(null)
  const [stores, setStores] = useState([])
  const [items, setItems] = useState([])
  const [newStoreName, setNewStoreName] = useState('')
  const [storeLocation, setStoreLocation] = useState(null) // { lat, lng } | null
  const [storeFormKey, setStoreFormKey] = useState(0)

  async function refresh() {
    const [h, s, i] = await Promise.all([
      getHangout(hangoutId),
      getStores(hangoutId),
      getItems(hangoutId),
    ])
    setHangout(h)
    setStores(s)
    setItems(i)
  }

  useEffect(() => {
    refresh().catch(() => {})
  }, [hangoutId])

  async function handleAddStore(e) {
    e.preventDefault()
    if (!newStoreName.trim()) return
    await createStore({
      hangout_id: parseInt(hangoutId, 10),
      store_name: newStoreName,
      // A picked suggestion gives this store its own real location (so the
      // route map actually has separate stops); typing a plain name with no
      // pick falls back to the hangout's own location, same as before.
      location_lat: storeLocation?.lat ?? hangout?.hangout_location_lat ?? 0,
      location_lng: storeLocation?.lng ?? hangout?.hangout_location_lng ?? 0,
      assigned_person_names: [],
      items_to_buy: [],
    })
    setNewStoreName('')
    setStoreLocation(null)
    setStoreFormKey((k) => k + 1) // remounts AddressField so its input clears too
    refresh()
  }

  async function handleAddItem(storeId, name, price) {
    if (!name.trim()) return
    await createItem({
      hangout_id: parseInt(hangoutId, 10),
      store_id: storeId,
      buyer_name: '',
      quantity: 1,
      item_name: name,
      cost_per_unit: price || 0,
      bought: false,
    })
    refresh()
  }

  async function handleRemoveStore(storeId) {
    if (!confirm('Remove this store and its items from the list?')) return
    await deleteStore(storeId)
    refresh()
  }

  async function handleToggleBought(item) {
    await updateItem(item.item_id, { bought: !item.bought })
    refresh()
  }

  async function handleUpdateField(item, field, value) {
    await updateItem(item.item_id, { [field]: value })
    refresh()
  }

  async function handleDelete(itemId) {
    await deleteItem(itemId)
    refresh()
  }

  const total = items.reduce((sum, i) => sum + i.total_item_cost, 0)

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>{hangout ? `${hangout.emoji || ''} ${hangout.hangout_name}` : 'Shopping list'}</h1>
          <p className="muted">${total.toFixed(2)} total so far</p>
        </div>
        <Link to="/" className="btn-secondary">Back home</Link>
      </div>

      {stores.map((store) => (
        <div key={store.store_id} className="store-block">
          <div className="store-block-header">
            <h3>{store.store_name}</h3>
            <button type="button" className="store-remove-btn" onClick={() => handleRemoveStore(store.store_id)}>
              Remove store
            </button>
          </div>
          <ItemTable
            items={items.filter((i) => i.store_id === store.store_id)}
            onToggleBought={handleToggleBought}
            onUpdateField={handleUpdateField}
            onDelete={handleDelete}
            onAddItem={(name, price) => handleAddItem(store.store_id, name, price)}
          />
        </div>
      ))}

      <form className="add-store-form" onSubmit={handleAddStore}>
        <AddressField
          key={storeFormKey}
          placeholder="Add a store (e.g. Trader Joe's) or search its address"
          hint={null}
          onQueryChange={setNewStoreName}
          onSelect={({ lat, lng }) => setStoreLocation({ lat, lng })}
          formatSelectedQuery={(s) => s.label.split(',')[0].trim()}
          formatSuggestionLabel={(s) => s.label.split(',')[0].trim()}
        />
        <button type="submit" className="btn-secondary">Add store</button>
      </form>
      <p className="muted add-store-hint">
        Pick a suggestion to place this store on the route map at its real address — or just type a name
        to add it without one.
      </p>
    </div>
  )
}

function ItemTable({ items, onToggleBought, onUpdateField, onDelete, onAddItem }) {
  return (
    <>
      <table className="item-table">
        <thead>
          <tr>
            <th></th>
            <th>Item</th>
            <th>Qty</th>
            <th>$/unit</th>
            <th>Total</th>
            <th>Buyer</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.item_id} className={item.bought ? 'item-row-bought' : ''}>
              <td>
                <input
                  type="checkbox"
                  checked={item.bought}
                  onChange={() => onToggleBought(item)}
                />
              </td>
              <td>{item.item_name}</td>
              <td>
                <input
                  type="number"
                  min="1"
                  className="item-cell-input"
                  defaultValue={item.quantity}
                  onBlur={(e) => onUpdateField(item, 'quantity', parseInt(e.target.value, 10) || 1)}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="item-cell-input"
                  defaultValue={item.cost_per_unit}
                  onBlur={(e) => onUpdateField(item, 'cost_per_unit', parseFloat(e.target.value) || 0)}
                />
              </td>
              <td>${item.total_item_cost.toFixed(2)}</td>
              <td>
                <input
                  type="text"
                  className="item-cell-input"
                  defaultValue={item.buyer_name}
                  onBlur={(e) => onUpdateField(item, 'buyer_name', e.target.value)}
                />
              </td>
              <td>
                <button type="button" className="item-delete-btn" onClick={() => onDelete(item.item_id)}>
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Deliberately NOT inside .item-table (which clips overflow for its
          rounded corners) — the suggestion dropdown needs to render past
          that boundary, not get clipped by it. */}
      <ItemAddRow onAdd={onAddItem} />
    </>
  )
}

// The item-name field IS the Kroger search box — no separate "Autosuggest"
// tab to switch to. Typing searches live; picking a result adds the item
// with its real price already filled in; pressing Enter with no pick still
// adds whatever was typed as a plain manual item (Kroger doesn't carry
// everything, and it's optional/unconfigured for some setups anyway).
function ItemAddRow({ onAdd }) {
  const [text, setText] = useState('')
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
    setText(next)
    setOpen(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const results = await suggestItems(next)
      setSuggestions(results)
      setLoading(false)
    }, 350)
  }

  function commit(name, price) {
    onAdd(name, price)
    setText('')
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="item-add-row" ref={wrapRef}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) commit(text.trim(), null)
        }}
      >
        <input
          type="text"
          placeholder="Add an item… (searches Kroger as you type)"
          className="item-cell-input"
          value={text}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
        />
      </form>

      {open && (loading || suggestions.length > 0) && (
        <ul className="address-suggestions item-suggestions">
          {loading && <li className="address-suggestion-loading">Searching Kroger…</li>}
          {!loading &&
            suggestions.map((s, i) => (
              <li key={i}>
                <button type="button" className="item-suggestion-btn" onClick={() => commit(s.name, s.price)}>
                  <span>{s.name}</span>
                  {s.price ? <span className="item-suggestion-price">${s.price}</span> : null}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
