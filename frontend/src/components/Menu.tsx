import { useEffect, useState } from 'react'
import api from '../api'
import type { MenuItem } from '../types'

interface MenuProps {
  restaurantId: number | null
  onAddItem: (item: MenuItem) => void
}

export default function Menu({ restaurantId, onAddItem }: MenuProps) {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!restaurantId) {
      setItems([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    api
      .get<MenuItem[]>(`/restaurants/${restaurantId}/menu`)
      .then((res) => {
        const cleaned: MenuItem[] = res.data.map((item) => ({
          ...item,
          price: typeof item.price === 'number' ? item.price : item.price ? Number(item.price) : null,
        }))
        setItems(cleaned)
        setError(null)
      })
      .catch((err) => {
        console.error(err)
        const message = err?.response?.data?.error ?? err?.message ?? 'Failed to load menu'
        setError(message)
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [restaurantId])

  if (!restaurantId) {
    return (
      <div className="menu card placeholder">
        <h3 className="section-title">Menu</h3>
        <div className="placeholder-body">
          <div className="large-emoji" aria-hidden>
            🥗
          </div>
          <div>
            <h4>Select a restaurant</h4>
            <p className="muted">Choose a restaurant from the left to view its menu.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="menu card">
      <h3 className="section-title">Menu</h3>
      {loading && <div className="muted">Loading menu...</div>}
      {error && <div className="banner error">{error}</div>}
      <div className="menu-grid" aria-live="polite">
        {items.map((item) => {
          const formattedPrice = typeof item.price === 'number' ? item.price.toFixed(2) : '--'

          return (
            <div key={item.id} className="menu-item" role="article">
              <div className="menu-thumb" aria-hidden>
                <div className="thumb-placeholder">🍽️</div>
              </div>
              <div className="menu-body">
                <div className="menu-name">{item.name}</div>
                <div className="menu-desc">{item.description}</div>
              </div>
              <div className="menu-price">${formattedPrice}</div>
              <button
                className="btn btn-primary"
                onClick={() => onAddItem(item)}
                aria-label={`Add ${item.name} to cart`}
              >
                Add
              </button>
            </div>
          )
        })}
        {!loading && !error && items.length === 0 && <div className="muted">No menu items.</div>}
      </div>
    </div>
  )
}
