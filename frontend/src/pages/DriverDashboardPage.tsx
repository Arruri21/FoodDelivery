import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api'
import { useAppContext } from '../context/AppContext'
import type { DriverOrder, DriverProfile, OrderStatus } from '../types'

interface DriverOrdersResponse {
  driver: DriverProfile
  orders: DriverOrder[]
}

const DRIVER_STATUS_OPTIONS: OrderStatus[] = ['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
const DRIVER_FINAL_STATUSES: OrderStatus[] = ['DELIVERED', 'CANCELLED']

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export default function DriverDashboardPage() {
  const { user } = useAppContext()
  const userId = user?.userId
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [orders, setOrders] = useState<DriverOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [updatingAvailability, setUpdatingAvailability] = useState(false)
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [pendingStatusOrderId, setPendingStatusOrderId] = useState<number | null>(null)
  const [orderDrafts, setOrderDrafts] = useState<Record<number, OrderStatus>>({})

  const toProfile = useCallback((payload: DriverProfile): DriverProfile => ({
    ...payload,
    available: Boolean(payload?.available),
  }), [])

  const fetchProfile = useCallback(async () => {
    if (!userId) return
    const response = await api.get<DriverProfile>('/driver/profile', { params: { userId } })
    setProfile(toProfile(response.data))
  }, [userId, toProfile])

  const fetchOrders = useCallback(async () => {
    if (!userId) return
    const response = await api.get<DriverOrdersResponse>('/driver/orders', { params: { userId } })
    if (response.data.driver) {
      setProfile(toProfile(response.data.driver))
    }
    setOrders(response.data.orders ?? [])
  }, [userId, toProfile])

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setOrders([])
      return
    }

    setLoading(true)
    setError(null)
    Promise.allSettled([fetchProfile(), fetchOrders()])
      .then((results) => {
        const rejected = results.find((result) => result.status === 'rejected') as PromiseRejectedResult | undefined
        if (rejected) {
          const payload: any = rejected.reason
          const message = payload?.response?.data?.error ?? payload?.message ?? 'Unable to load driver data.'
          setError(message)
        }
      })
      .finally(() => setLoading(false))
  }, [userId, fetchProfile, fetchOrders])

  useEffect(() => {
    setOrderDrafts((previous) => {
      const next: Record<number, OrderStatus> = {}
      orders.forEach((order) => {
        const current = (order.status ?? 'PREPARING') as OrderStatus
        const defaultStatus = DRIVER_STATUS_OPTIONS.includes(current) ? current : 'PREPARING'
        next[order.id] = previous[order.id] ?? defaultStatus
      })
      return next
    })
  }, [orders])

  const handleAvailabilityToggle = async () => {
    if (!userId || !profile) return
    const nextAvailable = !profile.available
    setUpdatingAvailability(true)
    setAvailabilityError(null)
    setStatusBanner(null)
    try {
      const response = await api.patch<DriverProfile>(
        '/driver/availability',
        { available: nextAvailable },
        { params: { userId } },
      )
      setProfile(toProfile(response.data))
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Unable to update availability.'
      setAvailabilityError(message)
    } finally {
      setUpdatingAvailability(false)
    }
  }

  const handleStatusDraftChange = (orderId: number, status: OrderStatus) => {
    setOrderDrafts((previous) => ({ ...previous, [orderId]: status }))
  }

  const handleOrderStatusUpdate = async (orderId: number) => {
    if (!userId) return
    const nextStatus = orderDrafts[orderId]
    if (!nextStatus) return
    setPendingStatusOrderId(orderId)
    setStatusBanner(null)
    try {
      await api.patch(`/driver/orders/${orderId}/status`, { status: nextStatus }, { params: { userId } })
      await fetchOrders()
      setStatusBanner({ type: 'success', message: `Order #${orderId} marked as ${STATUS_LABEL[nextStatus]}.` })
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Unable to update order status.'
      setStatusBanner({ type: 'error', message })
    } finally {
      setPendingStatusOrderId(null)
    }
  }

  const startOfDayOrders = useMemo(() => {
    if (orders.length === 0) return [] as DriverOrder[]
    return [...orders].sort((a, b) => {
      const aTime = a.orderDate ? new Date(a.orderDate).getTime() : 0
      const bTime = b.orderDate ? new Date(b.orderDate).getTime() : 0
      return bTime - aTime
    })
  }, [orders])

  const summary = useMemo(() => {
    const total = orders.length
    const delivered = orders.filter((order) => order.status === 'DELIVERED').length
    const inProgress = total - delivered
    return { total, delivered, inProgress }
  }, [orders])

  if (!userId) {
    return (
      <div className="card">
        <h2 className="section-title">Driver portal</h2>
        <p className="muted">Sign in with a driver account to view assignments.</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-head">
        <h2>Driver Portal</h2>
        <p className="muted">Toggle your availability and review the orders assigned to you.</p>
      </header>

      {error && <div className="banner error">{error}</div>}
      {availabilityError && <div className="banner error">{availabilityError}</div>}

      <div className="card driver-availability-card">
        <div className="driver-availability">
          <div>
            <h3 className="section-title">Availability</h3>
            <p className="muted">
              {profile?.available
                ? 'You are available to receive new delivery assignments.'
                : 'Set yourself to available when you are ready to accept deliveries.'}
            </p>
          </div>
          <button
            className="btn btn-primary"
            disabled={updatingAvailability || loading}
            onClick={handleAvailabilityToggle}
          >
            {updatingAvailability ? 'Updating...' : profile?.available ? 'Set as unavailable' : 'Set as available'}
          </button>
        </div>
      </div>

      <div className="card driver-summary-card">
        <div className="driver-summary">
          <div className="stat-chip">
            <span className="stat-count">{summary.total}</span>
            Orders today
          </div>
          <div className="stat-chip">
            <span className="stat-count">{summary.inProgress}</span>
            In progress
          </div>
          <div className="stat-chip">
            <span className="stat-count">{summary.delivered}</span>
            Delivered
          </div>
        </div>
      </div>

      {statusBanner && <div className={`banner ${statusBanner.type}`}>{statusBanner.message}</div>}

      <section className="admin-panel" aria-live="polite">
        {loading ? (
          <div className="card muted">Loading assignments...</div>
        ) : startOfDayOrders.length === 0 ? (
          <div className="card">
            <p className="muted">No orders assigned yet. Stay available to get your next delivery.</p>
          </div>
        ) : (
          <div className="admin-card-list">
            {startOfDayOrders.map((order) => {
              const currentStatus = (order.status ?? 'PENDING') as OrderStatus
              const draftStatus = orderDrafts[order.id] ?? (DRIVER_STATUS_OPTIONS.includes(currentStatus) ? currentStatus : 'PREPARING')
              const statusLocked = DRIVER_FINAL_STATUSES.includes(currentStatus)
              const isUpdatingStatus = pendingStatusOrderId === order.id
              const hasChanges = currentStatus !== draftStatus

              return (
                <article key={order.id} className="card driver-order-card">
                  <header className="driver-order-head">
                    <div>
                      <h3>Order #{order.id}</h3>
                      <p className="muted small-print">
                        {order.orderDate ? new Date(order.orderDate).toLocaleString() : 'Unknown time'}
                      </p>
                    </div>
                    <span className="pill">{STATUS_LABEL[currentStatus] ?? currentStatus}</span>
                  </header>
                  <div className="driver-order-body">
                    <div>
                      <h4 className="section-title">Restaurant</h4>
                      <p className="muted">{order.restaurant?.name ?? 'Unknown restaurant'}</p>
                      {order.restaurant?.contact && <p className="muted small-print">☎ {order.restaurant.contact}</p>}
                    </div>
                    <div>
                      <h4 className="section-title">Customer</h4>
                      <p className="muted">{order.customer?.name ?? 'Customer'}</p>
                      {order.customer?.phone && <p className="muted small-print">📞 {order.customer.phone}</p>}
                      {order.deliveryAddress && <p className="muted small-print">📍 {order.deliveryAddress}</p>}
                    </div>
                    <div>
                      <h4 className="section-title">Items</h4>
                      <ul className="muted checklist">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            {item.menuItem?.name ?? 'Item'} × {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <footer className="driver-order-footer">
                    <div className="driver-order-total">
                      <span>Total</span>
                      <strong>
                        {typeof order.totalAmount === 'number'
                          ? `$${order.totalAmount.toFixed(2)}`
                          : '--'}
                      </strong>
                    </div>
                    <div className="driver-order-actions">
                      {statusLocked ? (
                        <span className="admin-status-pill">{STATUS_LABEL[currentStatus]}</span>
                      ) : (
                        <>
                          <label className="driver-status-field">
                            <span>Update status</span>
                            <select
                              className="driver-status-select"
                              value={draftStatus}
                              disabled={isUpdatingStatus}
                              onChange={(event) => handleStatusDraftChange(order.id, event.target.value as OrderStatus)}
                            >
                              {DRIVER_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {STATUS_LABEL[status]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleOrderStatusUpdate(order.id)}
                            disabled={isUpdatingStatus || !hasChanges}
                          >
                            {isUpdatingStatus ? 'Updating...' : 'Save'}
                          </button>
                        </>
                      )}
                    </div>
                  </footer>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
