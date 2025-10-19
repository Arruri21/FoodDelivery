import { useEffect, useState } from 'react'
import api from '../api'
import type { Restaurant } from '../types'

interface RestaurantListProps {
  selectedId: number | null
  onSelect: (restaurant: Restaurant) => void
}

export default function RestaurantList({ selectedId, onSelect }: RestaurantListProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    api
      .get<Restaurant[]>('/restaurants')
      .then((res) => {
        setRestaurants(res.data)
        setError(null)
      })
      .catch((err) => {
        console.error(err)
        const message = err?.response?.data?.error ?? err?.message ?? 'Failed to load restaurants'
        setError(message)
        setRestaurants([])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="restaurant-list card">
      <h2 className="section-title">Restaurants</h2>
      {loading && <div className="muted">Loading restaurants...</div>}
      {error && <div className="banner error">{error}</div>}
      <div className="list-grid" aria-live="polite">
        {restaurants.map((restaurant) => {
          const ratingLabel = restaurant.rating !== undefined && restaurant.rating !== null ? restaurant.rating.toFixed(1) : '—'
          const isActive = restaurant.id === selectedId

          return (
            <div
              key={restaurant.id}
              className={isActive ? 'restaurant-card active' : 'restaurant-card'}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(restaurant)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onSelect(restaurant)
                }
              }}
              aria-pressed={isActive}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar" aria-hidden>
                  {restaurant.name ? restaurant.name.charAt(0) : 'R'}
                </div>
                <div className="restaurant-info">
                  <h3 className="restaurant-name">{restaurant.name}</h3>
                  <div className="restaurant-meta">
                    {restaurant.cuisine} • {ratingLabel}
                  </div>
                </div>
              </div>
              <div className="restaurant-actions">
                <button
                  className="btn btn-primary"
                  onClick={(event) => {
                    event.stopPropagation()
                    onSelect(restaurant)
                  }}
                >
                  View Menu
                </button>
              </div>
            </div>
          )
        })}
        {!loading && !error && restaurants.length === 0 && <div className="muted">No restaurants found.</div>}
      </div>
    </div>
  )
}
