import { useEffect, useState } from 'react'
import api from '../api'
import type { OrderSummaryPayload } from '../types'

interface OrderHistoryProps {
  userId: number
  refreshKey: number
}

export default function OrderHistory({ userId, refreshKey }: OrderHistoryProps) {
  const [orders, setOrders] = useState<OrderSummaryPayload[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.get<OrderSummaryPayload[]>(`/orders/user/${userId}`)
        if (!ignore) {
          setOrders(response.data)
        }
      } catch (err: any) {
        if (!ignore) {
          const apiMessage = err?.response?.data?.error ?? err?.message ?? 'Unable to load orders'
          setError(apiMessage)
          setOrders([])
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    run()
    return () => {
      ignore = true
    }
  }, [userId, refreshKey])

  return (
    <div className="card order-history">
      <h3 className="section-title">Recent orders</h3>
      {loading && <div className="muted">Loading orders...</div>}
      {error && <div className="banner error" role="alert">{error}</div>}
      {!loading && orders.length === 0 && <div className="muted">No orders yet. Place your first order to see it here.</div>}
      <div className="history-grid">
        {orders.map((order) => {
          const restaurantName = order.restaurant?.name ?? 'Unknown restaurant'
          const placedAt = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'Unknown time'
          const total = typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '--'
          return (
            <article key={order.id} className="history-card" aria-label={`Order ${order.id}`}>
              <header>
                <div>
                  <h4>#{order.id}</h4>
                  <p className="muted small-print">{placedAt}</p>
                </div>
                <span className="status-pill">{order.status ?? 'PENDING'}</span>
              </header>
              <div className="history-body">
                <p className="muted">{restaurantName}</p>
                <ul>
                  {order.items?.map((item) => (
                    <li key={item.id}>
                      {item.menuItem?.name ?? 'Item'} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
              <footer>
                <span>Total</span>
                <strong>${total}</strong>
              </footer>
            </article>
          )
        })}
      </div>
    </div>
  )
}
