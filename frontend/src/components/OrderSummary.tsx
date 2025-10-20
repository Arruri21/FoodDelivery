import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { CartItem } from '../types'
import PaymentModal from './PaymentModal'

interface OrderSummaryProps {
  cart: CartItem[]
  disabled: boolean
  onQuantityChange: (menuItemId: number, quantity: number) => void
  onRemove: (menuItemId: number) => void
  onClear: () => void
  onCheckout: (deliveryAddress?: string, paymentMethod?: string) => Promise<{ paymentQrCode?: string; paymentStatus?: string; orderId?: number }>
}

export default function OrderSummary({ cart, disabled, onQuantityChange, onRemove, onClear, onCheckout }: OrderSummaryProps) {
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [orderData, setOrderData] = useState<{ qrCode: string | null; orderId: number | null }>({ 
    qrCode: null, 
    orderId: null 
  })

  const total = useMemo(() => cart.reduce((acc, item) => acc + (item.price ?? 0) * item.quantity, 0), [cart])

  useEffect(() => {
    setError(null)
    // Don't close payment modal if cart becomes empty - user might be in the middle of payment
    if (cart.length === 0 && !showPaymentModal) {
      setMessage(null)
    }
  }, [cart, showPaymentModal])

  const handleQuantityInput = (event: ChangeEvent<HTMLInputElement>, menuItemId: number) => {
    const value = Number.parseInt(event.target.value, 10)
    if (Number.isNaN(value)) return
    const next = Math.max(1, value)
    onQuantityChange(menuItemId, next)
  }

  const handleCheckout = async () => {
    // Show payment modal first, before creating order
    setMessage(null)
    setError(null)
    
    // Store the delivery address for later use
    const address = deliveryAddress.trim() || undefined
    
    // Open payment modal without creating order yet
    setOrderData({
      qrCode: null, // Will be set after payment
      orderId: null // Will be set after order creation
    })
    setShowPaymentModal(true)
    
    // Store address in state for use after payment
    setDeliveryAddress(address || '')
  }
  
  const createOrderAfterPayment = async (transactionId: string, paymentMethod: string) => {
    setLoading(true)
    try {
      console.log('Creating order after successful payment. Transaction ID:', transactionId, 'Method:', paymentMethod)
      const result = await onCheckout(deliveryAddress.trim() || undefined, paymentMethod)
      console.log('Order created after payment:', result)
      if (result && typeof result === 'object') {
        const orderResult = result as { paymentQrCode?: string; orderId?: number }
        setDeliveryAddress('')
        return orderResult.orderId
      }
      return null
    } catch (err: any) {
      console.error('Order creation error:', err)
      const apiMessage = err?.response?.data?.error ?? err?.message ?? 'Unable to create order'
      throw new Error(apiMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentComplete = async (transactionId: string, paymentMethod: string) => {
    try {
      const orderId = await createOrderAfterPayment(transactionId, paymentMethod)
      setShowPaymentModal(false)
      setMessage(`Payment successful! Transaction ID: ${transactionId}. Order #${orderId} is being processed.`)
      setOrderData({ qrCode: null, orderId: null })
      onClear()
    } catch (err: any) {
      setError(`Payment successful but order creation failed: ${err.message}. Please contact support with transaction ID: ${transactionId}`)
    }
  }

  const handlePaymentClose = () => {
    setShowPaymentModal(false)
    setMessage('Payment cancelled. Your cart has been preserved.')
    // Don't clear the cart - user cancelled payment
  }

  return (
    <>
      <PaymentModal
        isOpen={showPaymentModal}
        orderAmount={total}
        qrCode={orderData.qrCode}
        orderId={orderData.orderId}
        onClose={handlePaymentClose}
        onPaymentComplete={handlePaymentComplete}
      />
      
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
    </>
  )
}
