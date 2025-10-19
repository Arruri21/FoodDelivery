import { Navigate, useNavigate } from 'react-router-dom'
import OrderSummary from '../components/OrderSummary'
import OrderHistory from '../components/OrderHistory'
import { useAppContext } from '../context/AppContext'

export default function CheckoutPage() {
  const {
    user,
    selectedRestaurant,
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    placeOrder,
    historyRefreshKey,
  } = useAppContext()
  const navigate = useNavigate()

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  const hasRestaurant = Boolean(selectedRestaurant)
  const canCheckout = hasRestaurant && cart.length > 0

  return (
    <div className="page-two-column">
      <section className="flow">
        <div className="menu-summary-head">
          <div>
            <h2 className="section-title">Checkout</h2>
            <p className="muted">
              {hasRestaurant
                ? selectedRestaurant?.name
                : 'Choose a restaurant and add items to your cart before placing an order.'}
            </p>
          </div>
          <div className="menu-summary-actions">
            <button className="btn btn-ghost" onClick={() => navigate('/restaurants')}>
              Browse restaurants
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/menu')}>
              View menu
            </button>
          </div>
        </div>
        <OrderSummary
          cart={cart}
          disabled={!hasRestaurant || !canCheckout}
          onQuantityChange={updateQuantity}
          onRemove={removeFromCart}
          onClear={clearCart}
          onCheckout={placeOrder}
        />
        {!hasRestaurant && (
          <div className="banner" role="status">
            Tip: select a restaurant and add dishes before checking out. You can still review previous orders on the right.
          </div>
        )}
      </section>
      <aside className="flow">
        <OrderHistory userId={user.userId} refreshKey={historyRefreshKey} />
      </aside>
    </div>
  )
}
