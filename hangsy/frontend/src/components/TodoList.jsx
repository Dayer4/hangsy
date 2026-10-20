import { useEffect, useState } from 'react'
import { getMyTodos, createTodo, updateTodo, deleteTodo } from '../lib/api.js'
import { IconPlus } from './icons.jsx'

// Personal to-do widget for the home page — separate from a hangout's own
// shopping list (Item model); this is general planning notes ("book the
// cabin") that don't belong to any one hangout.
export default function TodoList() {
  const [todos, setTodos] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyTodos()
      .then(setTodos)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setText('')
    const created = await createTodo(trimmed)
    setTodos((t) => [...t, created])
  }

  async function handleToggle(todo) {
    setTodos((t) => t.map((x) => (x.todo_id === todo.todo_id ? { ...x, done: !x.done } : x)))
    await updateTodo(todo.todo_id, { done: !todo.done })
  }

  async function handleDelete(todoId) {
    setTodos((t) => t.filter((x) => x.todo_id !== todoId))
    await deleteTodo(todoId)
  }

  return (
    <div className="todo-widget">
      <div className="todo-widget-title">To-do</div>

      {!loading && todos.length === 0 && <p className="todo-empty">Nothing on the list yet.</p>}

      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.todo_id} className={todo.done ? 'todo-item-done' : ''}>
            <label className="todo-check">
              <input type="checkbox" checked={todo.done} onChange={() => handleToggle(todo)} />
              <span className="todo-text">{todo.text}</span>
              {todo.auto_generated && <span className="todo-auto-badge">Auto</span>}
            </label>
            <button
              type="button"
              className="todo-remove"
              onClick={() => handleDelete(todo.todo_id)}
              aria-label="Remove"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <form className="todo-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Add something to remember…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="todo-add-btn" aria-label="Add to-do">
          <IconPlus />
        </button>
      </form>
    </div>
  )
}
