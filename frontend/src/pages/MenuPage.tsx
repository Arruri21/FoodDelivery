import { useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Menu from '../components/Menu'
import { useAppContext } from '../context/AppContext'

export default function MenuPage() {
  const { user, selectedRestaurant, addToCart, cart, updateQuantity, removeFromCart, clearCart } = useAppContext()
  const navigate = useNavigate()

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  const total = useMemo(() => cart.reduce((acc, item) => acc + (item.price ?? 0) * item.quantity, 0), [cart])
  const hasRestaurant = Boolean(selectedRestaurant)

  return (
    <div className="page-two-column">
      <div>
        <Menu restaurantId={selectedRestaurant?.id ?? null} onAddItem={addToCart} />
      </div>
      <aside className="card flow">
        <div className="menu-summary-head">
          <div>
            <h2 className="section-title">{selectedRestaurant?.name ?? 'Choose a restaurant'}</h2>
            <p className="muted">
              {selectedRestaurant
                ? `${selectedRestaurant.cuisine} · ${selectedRestaurant.rating ?? '—'} rating`
                : 'Pick any restaurant to see its menu and add dishes.'}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/restaurants')}>
            Browse restaurants
          </button>
        </div>
        {cart.length === 0 ? (
          <div className="muted empty-cart">
            {hasRestaurant ? 'Add dishes to build your order.' : 'Once you select a restaurant, its menu will appear here.'}
          </div>
        ) : (
          <div className="cart-grid">
            {cart.map((item) => {
              const price = item.price ?? 0
              return (
                <div key={item.id} className="cart-row">
                  <div>
                    <div className="cart-name">{item.name}</div>
                    <div className="muted small-print">${price.toFixed(2)}</div>
                  </div>
                  <div className="cart-actions">
                    <button className="qty" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease quantity of ${item.name}`}>
                      -
                    </button>
                    <span className="qty-label">{item.quantity}</span>
                    <button className="qty" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase quantity of ${item.name}`}>
                      +
                    </button>
                    <button className="btn btn-ghost" onClick={() => removeFromCart(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
            <div className="divider" aria-hidden />
            <div className="totals">
              <span>Subtotal</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
          </div>
        )}
        <div className="menu-summary-actions">
          <button className="btn btn-ghost" onClick={clearCart} disabled={cart.length === 0}>
            Clear cart
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/checkout')}
            disabled={!hasRestaurant || cart.length === 0}
          >
            Go to checkout
          </button>
        </div>
      </aside>
    </div>
  )
}
