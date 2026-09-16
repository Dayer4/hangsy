import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getHangout,
  getStores,
  createStore,
  getItems,
  createItem,
  updateItem,
  deleteItem,
  suggestItems,
} from '../lib/api.js'

export default function ShoppingListPage() {
  const { hangoutId } = useParams()
  const [hangout, setHangout] = useState(null)
  const [stores, setStores] = useState([])
  const [items, setItems] = useState([])
  const [tab, setTab] = useState('list') // 'list' | 'autosuggest'
  const [newStoreName, setNewStoreName] = useState('')
  const [suggestQuery, setSuggestQuery] = useState('')
  const [suggestions, setSuggestions] = useState(null) // null = not searched yet

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
      location_lat: hangout?.hangout_location_lat ?? 0,
      location_lng: hangout?.hangout_location_lng ?? 0,
      assigned_person_names: [],
      items_to_buy: [],
    })
    setNewStoreName('')
    refresh()
  }

  async function handleAddItem(storeId, name) {
    if (!name.trim()) return
    await createItem({
      hangout_id: parseInt(hangoutId, 10),
      store_id: storeId,
      buyer_name: '',
      quantity: 1,
      item_name: name,
      cost_per_unit: 0,
      bought: false,
    })
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

  async function handleSuggestSearch(e) {
    e.preventDefault()
    const results = await suggestItems(suggestQuery)
    setSuggestions(results)
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

      <div className="tab-row">
        <button
          type="button"
          className={`tab-button ${tab === 'list' ? 'tab-button-active' : ''}`}
          onClick={() => setTab('list')}
        >
          List
        </button>
        <button
          type="button"
          className={`tab-button ${tab === 'autosuggest' ? 'tab-button-active' : ''}`}
          onClick={() => setTab('autosuggest')}
        >
          Autosuggest (Kroger)
        </button>
      </div>

      {tab === 'list' ? (
        <>
          {stores.map((store) => (
            <div key={store.store_id} className="store-block">
              <h3>{store.store_name}</h3>
              <ItemTable
                items={items.filter((i) => i.store_id === store.store_id)}
                onToggleBought={handleToggleBought}
                onUpdateField={handleUpdateField}
                onDelete={handleDelete}
                onAddItem={(name) => handleAddItem(store.store_id, name)}
              />
            </div>
          ))}

          <form className="add-store-form" onSubmit={handleAddStore}>
            <input
              type="text"
              placeholder="Add a store (e.g. Trader Joe's)"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
            />
            <button type="submit" className="btn-secondary">Add store</button>
          </form>
        </>
      ) : (
        <div className="autosuggest-panel">
          <form onSubmit={handleSuggestSearch} className="add-store-form">
            <input
              type="text"
              placeholder="Search a product, e.g. 'chips'"
              value={suggestQuery}
              onChange={(e) => setSuggestQuery(e.target.value)}
            />
            <button type="submit" className="btn-secondary">Search</button>
          </form>

          {suggestions === null ? (
            <p className="muted">Search for a product to see real Kroger prices.</p>
          ) : suggestions.length === 0 ? (
            <p className="muted">
              No results — or Kroger autosuggest isn't configured yet
              (needs <code>KROGER_CLIENT_ID</code>/<code>KROGER_CLIENT_SECRET</code> in the backend's .env).
            </p>
          ) : (
            <ul className="suggestion-list">
              {suggestions.map((s, i) => (
                <li key={i} className="suggestion-row">
                  <span>{s.name}</span>
                  <span>{s.price ? `$${s.price}` : '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function ItemTable({ items, onToggleBought, onUpdateField, onDelete, onAddItem }) {
  const [newItemName, setNewItemName] = useState('')

  return (
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
        <tr>
          <td></td>
          <td colSpan={5}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onAddItem(newItemName)
                setNewItemName('')
              }}
            >
              <input
                type="text"
                placeholder="Add an item…"
                className="item-cell-input"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
            </form>
          </td>
        </tr>
      </tbody>
    </table>
  )
}
