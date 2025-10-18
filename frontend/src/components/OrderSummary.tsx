import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'

interface CartItem {
  id: number
  name: string
  price?: number | null
  quantity: number
}

interface OrderSummaryProps {
  cart: CartItem[]
  disabled: boolean
  onQuantityChange: (menuItemId: number, quantity: number) => void
  onRemove: (menuItemId: number) => void
  onClear: () => void
  onCheckout: (deliveryAddress?: string) => Promise<void>
}

export default function OrderSummary({ cart, disabled, onQuantityChange, onRemove, onClear, onCheckout }: OrderSummaryProps) {
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const total = useMemo(() => cart.reduce((acc, item) => acc + (item.price ?? 0) * item.quantity, 0), [cart])

  useEffect(() => {
    setError(null)
    if (cart.length === 0) {
      setMessage(null)
    }
  }, [cart])

  const handleQuantityInput = (event: ChangeEvent<HTMLInputElement>, menuItemId: number) => {
    const value = Number.parseInt(event.target.value, 10)
    if (Number.isNaN(value)) return
    const next = Math.max(1, value)
    onQuantityChange(menuItemId, next)
  }

  const handleCheckout = async () => {
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      await onCheckout(deliveryAddress.trim() || undefined)
      setMessage('Order placed! We will keep you posted on the status.')
      setDeliveryAddress('')
    } catch (err: any) {
      const apiMessage = err?.response?.data?.error ?? err?.message ?? 'Unable to place order'
      setError(apiMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card order-summary">
      <div className="summary-head">
        <h3 className="section-title">Your cart</h3>
        {cart.length > 0 && (
          <button className="btn btn-ghost" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      {message && <div className="banner success" role="status">{message}</div>}
      {error && <div className="banner error" role="alert">{error}</div>}

      {cart.length === 0 ? (
        <div className="muted empty-cart">Add dishes to start your order.</div>
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
                  <button className="qty" onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))} aria-label={`Decrease quantity of ${item.name}`}>
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) => handleQuantityInput(event, item.id)}
                    aria-label={`Quantity for ${item.name}`}
                  />
                  <button className="qty" onClick={() => onQuantityChange(item.id, item.quantity + 1)} aria-label={`Increase quantity of ${item.name}`}>
                    +
                  </button>
                  <button className="btn btn-ghost" onClick={() => onRemove(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
          <div className="divider" aria-hidden />
          <div className="totals">
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </div>
          <label className="field">
            <span>Delivery address</span>
            <textarea
              rows={2}
              value={deliveryAddress}
              placeholder="Leave blank to use your saved address"
              onChange={(event) => setDeliveryAddress(event.target.value)}
            />
          </label>
          <button className="btn btn-primary" onClick={handleCheckout} disabled={disabled || loading || cart.length === 0}>
            {loading ? 'Placing order...' : 'Place order'}
          </button>
          {(disabled || cart.length === 0) && (
            <p className="muted small-print">Sign in, pick a restaurant, and add dishes to enable checkout.</p>
          )}
        </div>
      )}
    </div>
  )
}
