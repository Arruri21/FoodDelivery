import { useState } from 'react'
import './App.css'
import RestaurantList from './components/RestaurantList'
import Menu from './components/Menu'
import AuthPanel, { type UserSession } from './components/AuthPanel'
import OrderSummary from './components/OrderSummary'
import OrderHistory from './components/OrderHistory'
import type { CartItem, MenuItem } from './types'
import api from './api'

function App() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null)
  const [user, setUser] = useState<UserSession | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [historyRefreshKey, setHistoryRefreshKey] = useState<number>(Date.now())

  const handleSelectRestaurant = (restaurantId: number) => {
    setSelectedRestaurant(restaurantId)
  }

  const handleAddToCart = (item: MenuItem) => {
    setCart((previous) => {
      const existing = previous.find((entry) => entry.id === item.id)
      if (existing) {
        return previous.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        )
      }
      return [...previous, { ...item, quantity: 1 }]
    })
  }

  const handleQuantityChange = (menuItemId: number, quantity: number) => {
    setCart((previous) =>
      previous.map((entry) => (entry.id === menuItemId ? { ...entry, quantity } : entry)),
    )
  }

  const handleRemoveItem = (menuItemId: number) => {
    setCart((previous) => previous.filter((entry) => entry.id !== menuItemId))
  }

  const handleClearCart = () => {
    setCart([])
  }

  const handleCheckout = async (deliveryAddress?: string) => {
    if (!user) {
      throw new Error('Please sign in to place an order.')
    }
    if (!selectedRestaurant) {
      throw new Error('Select a restaurant before placing an order.')
    }
    if (cart.length === 0) {
      throw new Error('Add items to your cart first.')
    }

    const payload = {
      userId: user.userId,
      restaurantId: selectedRestaurant,
      items: cart.map((entry) => ({ menuItemId: entry.id, quantity: entry.quantity })),
      ...(deliveryAddress ? { deliveryAddress } : {}),
    }

    await api.post('/orders', payload)
    setCart([])
    setHistoryRefreshKey(Date.now())
  }

  const handleAuthenticated = (session: UserSession) => {
    setUser(session)
    setHistoryRefreshKey(Date.now())
  }

  const handleLogout = () => {
    setUser(null)
    setCart([])
    setHistoryRefreshKey(Date.now())
  }

  return (
    <div className="App root-grid">
      <header className="app-header">
        <div className="brand">
          <div className="logo-badge">FD</div>
          <div>
            <h1>Food Delivery App</h1>
            <p className="tag">Fast • Fresh • Friendly</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <AuthPanel user={user} onAuthenticated={handleAuthenticated} onLogout={handleLogout} />
          <RestaurantList selectedId={selectedRestaurant} onSelect={handleSelectRestaurant} />
        </aside>

        <section className="content">
          <Menu restaurantId={selectedRestaurant} onAddItem={handleAddToCart} />
          <OrderSummary
            cart={cart}
            disabled={!user || !selectedRestaurant}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemoveItem}
            onClear={handleClearCart}
            onCheckout={handleCheckout}
          />
          {user && <OrderHistory userId={user.userId} refreshKey={historyRefreshKey} />}
        </section>
      </main>

      <footer className="app-footer">Made with ❤️ — Demo App</footer>
    </div>
  )
}

export default App
