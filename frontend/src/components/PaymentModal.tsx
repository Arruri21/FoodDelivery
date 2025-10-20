import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { ChangeEvent } from 'react'

interface PaymentModalProps {
  isOpen: boolean
  orderAmount: number
  qrCode: string | null
  orderId: number | null
  onClose: () => void
  onPaymentComplete: (transactionId: string, paymentMethod: string) => void
}

export default function PaymentModal({
  isOpen,
  orderAmount,
  qrCode,
  orderId,
  onClose,
  onPaymentComplete,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'qr' | 'cod'>('qr')
  const [upiId, setUpiId] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Generate UPI payment string for QR code
  const upiPaymentString = `upi://pay?pa=8125358163@ybl&pn=Arruri Bharath&am=${orderAmount.toFixed(2)}&cu=INR&tn=Food Order Payment`

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setPaymentMethod('qr')
      setUpiId('')
      setTransactionId('')
      setError(null)
      setShowSuccess(false)
    }
  }, [isOpen])

  const handlePayWithUPI = () => {
    if (!upiId.trim()) {
      setError('Please enter your UPI ID')
      return
    }

    // Validate UPI ID format
    const upiPattern = /^[\w.-]+@[\w.-]+$/
    if (!upiPattern.test(upiId)) {
      setError('Please enter a valid UPI ID (e.g., yourname@bank)')
      return
    }

    setError(null)
    setIsProcessing(true)

    // Simulate UPI payment processing
    setTimeout(() => {
      const mockTransactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      setTransactionId(mockTransactionId)
      setIsProcessing(false)
      setShowSuccess(true)

      // Notify parent after a brief delay
      setTimeout(() => {
        onPaymentComplete(mockTransactionId, 'UPI')
      }, 2000)
    }, 2000)
  }

  const handleVerifyPayment = () => {
    if (!transactionId.trim()) {
      setError('Please enter the transaction ID from your payment app')
      return
    }

    setError(null)
    setIsProcessing(true)

    // Simulate payment verification
    setTimeout(() => {
      setIsProcessing(false)
      setShowSuccess(true)

      setTimeout(() => {
        onPaymentComplete(transactionId, paymentMethod === 'qr' ? 'QR' : paymentMethod === 'upi' ? 'UPI' : 'COD')
      }, 1500)
    }, 1500)
  }

  const handleCOD = () => {
    setError(null)
    setShowSuccess(true)
    const codTransactionId = `COD${Date.now()}`
    setTimeout(() => {
      onPaymentComplete(codTransactionId, 'COD')
    }, 1000)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Complete Payment</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {showSuccess ? (
          <div className="payment-success">
            <div className="success-icon">✓</div>
            <h3>Payment Successful!</h3>
            <p>Transaction ID: {transactionId}</p>
            <p className="muted">Your order is being processed...</p>
          </div>
        ) : (
          <>
            <div className="payment-amount">
              <span className="muted">Total Amount</span>
              <span className="amount">₹{orderAmount.toFixed(2)}</span>
            </div>

            <div className="payment-methods">
              <h3>Choose Payment Method</h3>

              <div className="payment-tabs">
                <button
                  className={`payment-tab ${paymentMethod === 'qr' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('qr')}
                >
                  <span className="tab-icon">📱</span>
                  Scan QR Code
                </button>
                <button
                  className={`payment-tab ${paymentMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <span className="tab-icon">💳</span>
                  UPI ID
                </button>
                <button
                  className={`payment-tab ${paymentMethod === 'cod' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <span className="tab-icon">💵</span>
                  Cash on Delivery
                </button>
              </div>

              {error && (
                <div className="banner error" role="alert">
                  {error}
                </div>
              )}

              <div className="payment-form">
                {paymentMethod === 'qr' && (
                  <div className="qr-payment">
                    <div className="qr-display" style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <QRCodeSVG value={upiPaymentString} size={180} />
                      <p className="muted" style={{ marginTop: '8px' }}>Scan this QR code with any UPI app</p>
                      <div style={{ marginTop: '8px' }}>
                        <span>UPI ID: <strong>8125358163@ybl</strong></span><br />
                        <span>Amount: <strong>₹{orderAmount.toFixed(2)}</strong></span>
                      </div>
                    </div>

                    <div className="divider">
                      <span>After payment</span>
                    </div>

                    <label className="field">
                      <span>Enter Transaction ID</span>
                      <input
                        type="text"
                        placeholder="e.g., 123456789012"
                        value={transactionId}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setTransactionId(e.target.value)}
                      />
                    </label>
                    <button
                      className="btn btn-primary"
                      onClick={handleVerifyPayment}
                      disabled={isProcessing || !transactionId.trim()}
                    >
                      {isProcessing ? 'Verifying...' : 'Verify Payment'}
                    </button>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="upi-payment">
                    <p className="muted">Pay directly using your UPI ID</p>
                    <label className="field">
                      <span>UPI ID</span>
                      <input
                        type="text"
                        placeholder="yourname@paytm"
                        value={upiId}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setUpiId(e.target.value)}
                      />
                      <small className="field-hint">Enter your UPI ID (e.g., 9876543210@ybl)</small>
                    </label>
                    <button
                      className="btn btn-primary"
                      onClick={handlePayWithUPI}
                      disabled={isProcessing || !upiId.trim()}
                    >
                      {isProcessing ? 'Processing...' : `Pay ₹${orderAmount.toFixed(2)}`}
                    </button>
                    <p className="small-print muted" style={{ marginTop: '12px' }}>
                      You'll receive a payment request on your UPI app. Approve it to complete payment.
                    </p>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="cod-payment">
                    <div className="cod-info">
                      <p>
                        <strong>Cash on Delivery</strong>
                      </p>
                      <p className="muted">Pay ₹{orderAmount.toFixed(2)} in cash when your order is delivered.</p>
                      <ul className="cod-notes">
                        <li>Keep exact change ready</li>
                        <li>Payment accepted in cash only</li>
                        <li>Contactless delivery available</li>
                      </ul>
                    </div>
                    <button className="btn btn-primary" onClick={handleCOD}>
                      Confirm Order (COD)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
