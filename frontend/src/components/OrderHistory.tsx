import { useEffect, useState } from 'react'
import api from '../api'
import type { OrderStatus, OrderSummaryPayload } from '../types'

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

interface OrderHistoryProps {
  userId: number
  refreshKey: number
}

export default function OrderHistory({ userId, refreshKey }: OrderHistoryProps) {
  const [orders, setOrders] = useState<OrderSummaryPayload[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const cancelableStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED']

  useEffect(() => {
    let ignore = false
    const run = async () => {
      setLoading(true)
      setError(null)
      setBanner(null)
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

  const handleCancel = async (orderId: number) => {
    setCancellingId(orderId)
    setBanner(null)
    try {
      const response = await api.patch<{ orderId: number; status: OrderStatus }>(
        `/orders/${orderId}/cancel`,
        {},
        { params: { userId } },
      )
      setOrders((previous) =>
        previous.map((order) =>
          order.id === orderId ? { ...order, status: response.data.status ?? 'CANCELLED' } : order,
        ),
      )
      setBanner({ type: 'success', message: `Order #${orderId} has been cancelled.` })
    } catch (err: any) {
      const apiMessage = err?.response?.data?.error ?? err?.message ?? 'Unable to cancel order'
      setBanner({ type: 'error', message: apiMessage })
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="card order-history">
      <h3 className="section-title">Recent orders</h3>
      {loading && <div className="muted">Loading orders...</div>}
      {error && <div className="banner error" role="alert">{error}</div>}
      {banner && !error && (
        <div className={`banner ${banner.type}`} role={banner.type === 'error' ? 'alert' : 'status'}>
          {banner.message}
        </div>
      )}
      {!loading && orders.length === 0 && <div className="muted">No orders yet. Place your first order to see it here.</div>}
      <div className="history-grid">
        {orders.map((order) => {
          const restaurantName = order.restaurant?.name ?? 'Unknown restaurant'
          const placedAt = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'Unknown time'
          const total = typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '--'
          const status = (order.status ?? 'PENDING') as OrderStatus
          const canCancel = cancelableStatuses.includes(status)
          return (
            <article key={order.id} className="history-card" aria-label={`Order ${order.id}`}>
              <header>
                <div>
                  <h4>#{order.id}</h4>
                  <p className="muted small-print">{placedAt}</p>
                </div>
                <span className="status-pill">{STATUS_LABEL[status] ?? status}</span>
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
                {canCancel && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleCancel(order.id)}
                    disabled={cancellingId === order.id}
                  >
                    {cancellingId === order.id ? 'Cancelling...' : 'Cancel order'}
                  </button>
                )}
              </footer>
            </article>
          )
        })}
      </div>
    </div>
  )
}
