import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RestaurantList from '../components/RestaurantList'
import { useAppContext } from '../context/AppContext'
import type { Restaurant } from '../types'

export default function RestaurantsPage() {
  const { user, selectedRestaurant, selectRestaurant } = useAppContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true })
    }
  }, [user, navigate])

  const handleSelect = (restaurant: Restaurant) => {
    selectRestaurant(restaurant)
  }

  return (
    <div className="page-two-column">
      <div>
        <RestaurantList selectedId={selectedRestaurant?.id ?? null} onSelect={handleSelect} />
      </div>
      <aside className="card flow">
        <h2 className="section-title">Pick your spot</h2>
        <p className="muted">Browse the list and choose a restaurant to view its curated menu.</p>
        <ul className="muted checklist">
          <li>Step 1 · Sign in</li>
          <li>Step 2 · Choose a restaurant</li>
          <li>Step 3 · Add favourites to your cart</li>
          <li>Step 4 · Checkout</li>
        </ul>
        <button className="btn btn-primary" onClick={() => navigate('/menu')} disabled={!selectedRestaurant}>
          {selectedRestaurant ? 'Explore menu' : 'Select a restaurant'}
        </button>
      </aside>
    </div>
  )
}
