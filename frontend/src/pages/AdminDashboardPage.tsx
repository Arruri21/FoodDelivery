import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import api from '../api'
import { useAppContext } from '../context/AppContext'
import type { AdminDriver, AdminOrder, AdminRestaurantEntry, MenuItem, OrderStatus } from '../types'

type TabKey = 'orders' | 'restaurants' | 'addRestaurant'

type BannerState = { type: 'success' | 'error'; message: string } | null

type RestaurantForm = {
  name: string
  cuisine: string
  address: string
  contact: string
  rating: string
}

type MenuItemForm = {
  name: string
  description: string
  price: string
}

const ADMIN_EDITABLE_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED']

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

const RESTAURANT_TEMPLATE: RestaurantForm = {
  name: '',
  cuisine: '',
  address: '',
  contact: '',
  rating: '',
}

const MENU_ITEM_TEMPLATE: MenuItemForm = {
  name: '',
  description: '',
  price: '',
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) {
    return '--'
  }
  return currencyFormatter.format(value)
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '--'
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toLocaleString()
}

function resolveErrorMessage(error: unknown, fallback: string) {
  const source = error as {
    response?: { data?: { error?: string; message?: string } }
    message?: string
  }
  return source?.response?.data?.error ?? source?.response?.data?.message ?? source?.message ?? fallback
}

function toRestaurantForm(restaurant: AdminRestaurantEntry['restaurant']): RestaurantForm {
  return {
    name: restaurant.name ?? '',
    cuisine: restaurant.cuisine ?? '',
    address: restaurant.address ?? '',
    contact: restaurant.contact ?? '',
    rating: restaurant.rating !== undefined && restaurant.rating !== null ? String(restaurant.rating) : '',
  }
}

function toMenuItemForm(menuItem: MenuItem): MenuItemForm {
  return {
    name: menuItem.name ?? '',
    description: menuItem.description ?? '',
    price: menuItem.price !== undefined && menuItem.price !== null ? String(menuItem.price) : '',
  }
}

function parseNumeric(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  const numeric = Number(trimmed)
  return Number.isFinite(numeric) ? numeric : null
}

export default function AdminDashboardPage() {
  const { user } = useAppContext()
  const userId = user?.userId
  const [activeTab, setActiveTab] = useState<TabKey>('orders')
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [drivers, setDrivers] = useState<AdminDriver[]>([])
  const [restaurants, setRestaurants] = useState<AdminRestaurantEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [banner, setBanner] = useState<BannerState>(null)

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      throw new Error('Missing admin context.')
    }
    const response = await api.get<AdminOrder[]>('/admin/orders', { params: { userId } })
    setOrders(response.data ?? [])
  }, [userId])

  const fetchRestaurants = useCallback(async () => {
    if (!userId) {
      throw new Error('Missing admin context.')
    }
    const response = await api.get<AdminRestaurantEntry[]>('/admin/restaurants', { params: { userId } })
    setRestaurants(response.data ?? [])
  }, [userId])

  const fetchDrivers = useCallback(async () => {
    if (!userId) {
      throw new Error('Missing admin context.')
    }
    const response = await api.get<AdminDriver[]>('/admin/drivers', { params: { userId } })
    setDrivers(response.data ?? [])
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setOrders([])
      setRestaurants([])
      setDrivers([])
      setLoading(false)
      return
    }

    setLoading(true)
    setBanner(null)

    Promise.all([fetchOrders(), fetchRestaurants(), fetchDrivers()])
      .catch((error) => {
        setBanner({ type: 'error', message: resolveErrorMessage(error, 'Unable to load admin data.') })
      })
      .finally(() => setLoading(false))
  }, [userId, fetchOrders, fetchRestaurants, fetchDrivers])

  const handleUpdateOrderStatus = useCallback(
    async (orderId: number, status: OrderStatus) => {
      if (!userId) {
        throw new Error('Missing admin context.')
      }
      try {
        const response = await api.patch<AdminOrder>(`/admin/orders/${orderId}`, { status }, { params: { userId } })
        setOrders((previous) => previous.map((order) => (order.id === orderId ? response.data : order)))
        await fetchDrivers()
        setBanner({ type: 'success', message: 'Order status updated.' })
      } catch (error) {
        setBanner({ type: 'error', message: resolveErrorMessage(error, 'Unable to update order status.') })
        throw error
      }
    },
    [userId, fetchDrivers],
  )

  const handleAssignDriver = useCallback(
    async (orderId: number, driverId: number | null) => {
      if (!userId) {
        throw new Error('Missing admin context.')
      }
      try {
        const payload: { driverId: number | null } = { driverId }
        const response = await api.patch<AdminOrder>(`/admin/orders/${orderId}`, payload, { params: { userId } })
        setOrders((previous) => previous.map((order) => (order.id === orderId ? response.data : order)))
        await fetchDrivers()
        setBanner({ type: 'success', message: driverId ? 'Driver assigned to order.' : 'Driver removed from order.' })
      } catch (error) {
        setBanner({ type: 'error', message: resolveErrorMessage(error, 'Unable to update driver assignment.') })
        throw error
      }
    },
    [userId, fetchDrivers],
  )

  const handleCreateRestaurant = useCallback(
    async (form: RestaurantForm) => {
      if (!userId) {
        throw new Error('Missing admin context.')
      }
      const payload = {
        name: form.name.trim(),
        cuisine: form.cuisine.trim(),
        address: form.address.trim(),
        contact: form.contact.trim(),
        rating: parseNumeric(form.rating),
      }
      try {
        await api.post('/admin/restaurants', payload, { params: { userId } })
        await fetchRestaurants()
        setBanner({ type: 'success', message: 'Restaurant created.' })
      } catch (error) {
        setBanner({ type: 'error', message: resolveErrorMessage(error, 'Unable to create restaurant.') })
        throw error
      }
    },
    [userId, fetchRestaurants],
  )

  const handleUpdateRestaurant = useCallback(
    async (restaurantId: number, form: RestaurantForm) => {
      if (!userId) {
        throw new Error('Missing admin context.')
      }
      const payload = {
        name: form.name.trim(),
        cuisine: form.cuisine.trim(),
        address: form.address.trim(),
        contact: form.contact.trim(),
        rating: parseNumeric(form.rating),
      }
      try {
        const response = await api.put(`/admin/restaurants/${restaurantId}`, payload, { params: { userId } })
        setRestaurants((previous) =>
          previous.map((entry) =>
            entry.restaurant.id === restaurantId ? { ...entry, restaurant: { ...entry.restaurant, ...response.data } } : entry,
          ),
        )
        setBanner({ type: 'success', message: 'Restaurant details saved.' })
        await fetchRestaurants()
      } catch (error) {
        setBanner({ type: 'error', message: resolveErrorMessage(error, 'Unable to update restaurant.') })
        throw error
      }
    },
    [userId, fetchRestaurants],
  )

  const handleDeleteRestaurant = useCallback(
    async (restaurantId: number) => {
      if (!userId) {
        throw new Error('Missing admin context.')
      }
      try {
        await api.delete(`/admin/restaurants/${restaurantId}`, { params: { userId } })
        await fetchRestaurants()
        setBanner({ type: 'success', message: 'Restaurant removed.' })
      } catch (error) {
        setBanner({ type: 'error', message: resolveErrorMessage(error, 'Unable to delete restaurant.') })
        throw error
      }
    },
    [userId, fetchRestaurants],
  )

  const handleCreateMenuItem = useCallback(
    async (restaurantId: number, form: MenuItemForm) => {
      if (!userId) {
        throw new Error('Missing admin context.')
      }
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseNumeric(form.price),
      }
      try {
        await api.post(`/admin/restaurants/${restaurantId}/menu`, payload, { params: { userId } })
        await fetchRestaurants()
        setBanner({ type: 'success', message: 'Menu item added.' })
      } catch (error) {
        setBanner({ type: 'error', message: resolveErrorMessage(error, 'Unable to add menu item.') })
        throw error
      }
    },
    [userId, fetchRestaurants],
  )

  const handleUpdateMenuItem = useCallback(
    async (menuItemId: number, form: MenuItemForm) => {
      if (!userId) {
        throw new Error('Missing admin context.')
      }
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseNumeric(form.price),
      }
      try {
        await api.put(`/admin/menu/${menuItemId}`, payload, { params: { userId } })
        await fetchRestaurants()
        setBanner({ type: 'success', message: 'Menu item updated.' })
      } catch (error) {
        setBanner({ type: 'error', message: resolveErrorMessage(error, 'Unable to update menu item.') })
        throw error
      }
    },
    [userId, fetchRestaurants],
  )

  const handleDeleteMenuItem = useCallback(
    async (menuItemId: number) => {
      if (!userId) {
        throw new Error('Missing admin context.')
      }
      try {
        await api.delete(`/admin/menu/${menuItemId}`, { params: { userId } })
        await fetchRestaurants()
        setBanner({ type: 'success', message: 'Menu item removed.' })
      } catch (error) {
        setBanner({ type: 'error', message: resolveErrorMessage(error, 'Unable to delete menu item.') })
        throw error
      }
    },
    [userId, fetchRestaurants],
  )

  const tabOptions = useMemo(
    () => [
      { key: 'orders' as TabKey, label: 'Orders' },
      { key: 'restaurants' as TabKey, label: 'Manage Restaurants' },
      { key: 'addRestaurant' as TabKey, label: 'Add Restaurant' },
    ],
    [],
  )

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-head">
        <h2>Admin Dashboard</h2>
        <p className="muted">Review live orders, adjust restaurants, and manage menus from one place.</p>
      </header>

      {banner && <div className={`banner ${banner.type}`}>{banner.message}</div>}

      <div className="admin-tabs" role="tablist">
        {tabOptions.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="admin-panel" aria-live="polite">
        {loading ? (
          <div className="card muted">Loading admin data...</div>
        ) : activeTab === 'orders' ? (
          <OrdersTab
            orders={orders}
            drivers={drivers}
            onStatusChange={handleUpdateOrderStatus}
            onDriverChange={handleAssignDriver}
          />
        ) : activeTab === 'restaurants' ? (
          <ManageRestaurantsTab
            entries={restaurants}
            onRequestAdd={() => setActiveTab('addRestaurant')}
            onUpdateRestaurant={handleUpdateRestaurant}
            onDeleteRestaurant={handleDeleteRestaurant}
            onCreateMenuItem={handleCreateMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
          />
        ) : (
          <AddRestaurantTab
            onCreateRestaurant={handleCreateRestaurant}
            onBackToList={() => setActiveTab('restaurants')}
          />
        )}
      </section>
    </div>
  )
}

type OrdersTabProps = {
  orders: AdminOrder[]
  drivers: AdminDriver[]
  onStatusChange: (orderId: number, status: OrderStatus) => Promise<void>
  onDriverChange: (orderId: number, driverId: number | null) => Promise<void>
}

function OrdersTab({ orders, drivers, onStatusChange, onDriverChange }: OrdersTabProps) {
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null)
  const [pendingDriverOrderId, setPendingDriverOrderId] = useState<number | null>(null)
  const availableDrivers = drivers.filter((driver) => driver.available === true).length
  const busyDrivers = drivers.length - availableDrivers

  if (orders.length === 0) {
    return (
      <div className="card">
        <h3 className="section-title">Recent Orders</h3>
        <p className="muted">No orders have been placed yet.</p>
        {drivers.length > 0 && (
          <div className="admin-driver-summary admin-stats">
            <span className="stat-chip">
              <span className="stat-count">{availableDrivers}</span>
              Available drivers
            </span>
            <span className="stat-chip">
              <span className="stat-count">{busyDrivers}</span>
              Busy drivers
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="section-title">Recent Orders</h3>
      {drivers.length > 0 && (
        <div className="admin-driver-summary admin-stats">
          <span className="stat-chip">
            <span className="stat-count">{availableDrivers}</span>
            Available drivers
          </span>
          <span className="stat-chip">
            <span className="stat-count">{busyDrivers}</span>
            Busy drivers
          </span>
        </div>
      )}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Customer</th>
              <th scope="col">Restaurant</th>
              <th scope="col">Total</th>
              <th scope="col">Placed</th>
              <th scope="col">Driver</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>
                  <div className="orders-cell">
                    <strong>{order.user?.name ?? 'Unknown'}</strong>
                    <span className="muted">{order.user?.email ?? '—'}</span>
                    <span className="muted">{order.deliveryAddress ?? 'Pickup'}</span>
                  </div>
                </td>
                <td>{order.restaurant?.name ?? '—'}</td>
                <td>{formatCurrency(order.totalAmount)}</td>
                <td>{formatDateTime(order.orderDate)}</td>
                <td>
                  <select
                    className="admin-select"
                    value={order.driver?.id ? String(order.driver.id) : ''}
                    disabled={pendingDriverOrderId === order.id}
                    onChange={async (event) => {
                      const nextDriverId = event.target.value ? Number(event.target.value) : null
                      setPendingDriverOrderId(order.id)
                      try {
                        await onDriverChange(order.id, nextDriverId)
                      } catch (error) {
                        console.error(error)
                      } finally {
                        setPendingDriverOrderId(null)
                      }
                    }}
                  >
                    <option value="">Unassigned</option>
                    {order.driver && !drivers.some((driver) => driver.id === order.driver?.id) && (
                      <option value={String(order.driver.id)}>
                        {order.driver.name ? `${order.driver.name} (Inactive)` : `Driver #${order.driver.id} (Inactive)`}
                      </option>
                    )}
                    {drivers.map((driver) => {
                      const label = driver.name ? driver.name : `Driver #${driver.id}`
                      const suffix = driver.available === false ? ' (Busy)' : ''
                      const optionLabel = `${label}${suffix}`
                      const disabled = driver.available === false && driver.id !== order.driver?.id
                      return (
                        <option
                          key={driver.id}
                          value={String(driver.id)}
                          disabled={disabled}
                          title={driver.contact ? `${optionLabel} • ${driver.contact}` : optionLabel}
                        >
                          {optionLabel}
                        </option>
                      )
                    })}
                  </select>
                </td>
                <td>
                  {ADMIN_EDITABLE_STATUSES.includes(order.status) ? (
                    <select
                      className="admin-select"
                      value={order.status}
                      disabled={pendingOrderId === order.id}
                      onChange={async (event) => {
                        const nextStatus = event.target.value as OrderStatus
                        setPendingOrderId(order.id)
                        try {
                          await onStatusChange(order.id, nextStatus)
                        } catch (error) {
                          console.error(error)
                        } finally {
                          setPendingOrderId(null)
                        }
                      }}
                    >
                      {ADMIN_EDITABLE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="admin-status-pill">{STATUS_LABEL[order.status]}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type ManageRestaurantsTabProps = {
  entries: AdminRestaurantEntry[]
  onRequestAdd: () => void
  onUpdateRestaurant: (restaurantId: number, form: RestaurantForm) => Promise<void>
  onDeleteRestaurant: (restaurantId: number) => Promise<void>
  onCreateMenuItem: (restaurantId: number, form: MenuItemForm) => Promise<void>
  onUpdateMenuItem: (menuItemId: number, form: MenuItemForm) => Promise<void>
  onDeleteMenuItem: (menuItemId: number) => Promise<void>
}

function ManageRestaurantsTab({
  entries,
  onRequestAdd,
  onUpdateRestaurant,
  onDeleteRestaurant,
  onCreateMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
}: ManageRestaurantsTabProps) {
  const [filter, setFilter] = useState('')
  const [expandedIds, setExpandedIds] = useState<number[]>(() =>
    entries.length > 0 ? [entries[0].restaurant.id] : [],
  )

  useEffect(() => {
    setExpandedIds((previous) => {
      const validIds = new Set(entries.map((entry) => entry.restaurant.id))
      const next = previous.filter((id) => validIds.has(id))
      if (next.length === 0 && entries.length > 0) {
        return [entries[0].restaurant.id]
      }
      return next.length === previous.length ? previous : next
    })
  }, [entries])

  const summary = useMemo(
    () => ({
      totalRestaurants: entries.length,
      totalMenuItems: entries.reduce((total, entry) => total + entry.menuItems.length, 0),
    }),
    [entries],
  )

  const filteredEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      const aName = (a.restaurant.name ?? '').toLocaleLowerCase()
      const bName = (b.restaurant.name ?? '').toLocaleLowerCase()
      return aName.localeCompare(bName)
    })

    const query = filter.trim().toLocaleLowerCase()
    if (!query) {
      return sorted
    }
    return sorted.filter((entry) => {
      const name = entry.restaurant.name?.toLocaleLowerCase() ?? ''
      const cuisine = entry.restaurant.cuisine?.toLocaleLowerCase() ?? ''
      return name.includes(query) || cuisine.includes(query)
    })
  }, [entries, filter])

  const isSearching = filter.trim().length > 0

  const toggleExpanded = useCallback((restaurantId: number) => {
    setExpandedIds((previous) =>
      previous.includes(restaurantId)
        ? previous.filter((id) => id !== restaurantId)
        : [...previous, restaurantId],
    )
  }, [])

  const clearFilter = useCallback(() => setFilter(''), [])

  return (
    <div className="admin-restaurants">
      <div className="card admin-toolbar-card">
        <div className="admin-toolbar">
          <div className="admin-stats">
            <span className="stat-chip">
              <span className="stat-count">{summary.totalRestaurants}</span>
              Restaurants
            </span>
            <span className="stat-chip">
              <span className="stat-count">{summary.totalMenuItems}</span>
              Menu items
            </span>
          </div>
          <div className="admin-toolbar-actions">
            <div className="admin-search" role="search">
              <input
                className="admin-input"
                type="search"
                placeholder="Search restaurants or cuisines"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
              {filter && (
                <button type="button" className="btn btn-ghost" onClick={clearFilter}>
                  Clear
                </button>
              )}
            </div>
            <button type="button" className="btn btn-primary" onClick={onRequestAdd}>
              Add restaurant
            </button>
          </div>
        </div>
      </div>

      <div className="admin-card-list">
        {filteredEntries.length === 0 ? (
          <div className="card">
            <p className="muted">
              {isSearching
                ? 'No restaurants match your search. Try a different keyword.'
                : 'No restaurants found. Use "Add restaurant" to create your first entry.'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <RestaurantCard
              key={entry.restaurant.id}
              entry={entry}
              expanded={expandedIds.includes(entry.restaurant.id)}
              onToggle={() => toggleExpanded(entry.restaurant.id)}
              onUpdateRestaurant={onUpdateRestaurant}
              onDeleteRestaurant={onDeleteRestaurant}
              onCreateMenuItem={onCreateMenuItem}
              onUpdateMenuItem={onUpdateMenuItem}
              onDeleteMenuItem={onDeleteMenuItem}
            />
          ))
        )}
      </div>
    </div>
  )
}

type AddRestaurantTabProps = {
  onCreateRestaurant: (form: RestaurantForm) => Promise<void>
  onBackToList: () => void
}

function AddRestaurantTab({ onCreateRestaurant, onBackToList }: AddRestaurantTabProps) {
  const [form, setForm] = useState<RestaurantForm>(RESTAURANT_TEMPLATE)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await onCreateRestaurant(form)
      setForm(RESTAURANT_TEMPLATE)
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-add-restaurant">
      <div className="card admin-toolbar-card">
        <div className="admin-add-head">
          <div>
            <h3 className="section-title">Create a restaurant</h3>
            <p className="muted">Add the core details so this location can accept orders.</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onBackToList}>
            Back to overview
          </button>
        </div>
        <ul className="admin-guidelines">
          <li>Name and cuisine appear in the customer app—keep them clear and descriptive.</li>
          <li>Add a contact number so couriers or customers can reach the venue if needed.</li>
          <li>Optional rating can highlight flagship locations (0-5 scale).</li>
        </ul>
      </div>

      <div className="card">
        <form className="admin-form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
          </label>
          <label className="field">
            <span>Cuisine</span>
            <input
              value={form.cuisine}
              onChange={(event) => setForm((prev) => ({ ...prev, cuisine: event.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>Contact</span>
            <input value={form.contact} onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))} />
          </label>
          <label className="field">
            <span>Address</span>
            <textarea
              rows={3}
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>Rating</span>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={(event) => setForm((prev) => ({ ...prev, rating: event.target.value }))}
            />
          </label>
          <div className="admin-form-actions">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              Save restaurant
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setForm(RESTAURANT_TEMPLATE)}
              disabled={submitting}
            >
              Clear form
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type RestaurantCardProps = {
  entry: AdminRestaurantEntry
  expanded: boolean
  onToggle: () => void
  onUpdateRestaurant: (restaurantId: number, form: RestaurantForm) => Promise<void>
  onDeleteRestaurant: (restaurantId: number) => Promise<void>
  onCreateMenuItem: (restaurantId: number, form: MenuItemForm) => Promise<void>
  onUpdateMenuItem: (menuItemId: number, form: MenuItemForm) => Promise<void>
  onDeleteMenuItem: (menuItemId: number) => Promise<void>
}

function RestaurantCard({
  entry,
  expanded,
  onToggle,
  onUpdateRestaurant,
  onDeleteRestaurant,
  onCreateMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
}: RestaurantCardProps) {
  const [draft, setDraft] = useState<RestaurantForm>(() => toRestaurantForm(entry.restaurant))
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [newItem, setNewItem] = useState<MenuItemForm>(MENU_ITEM_TEMPLATE)
  const [addingItem, setAddingItem] = useState(false)

  useEffect(() => {
    setDraft(toRestaurantForm(entry.restaurant))
  }, [entry.restaurant])

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await onUpdateRestaurant(entry.restaurant.id, draft)
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (removing) return
    setRemoving(true)
    try {
      await onDeleteRestaurant(entry.restaurant.id)
    } catch (error) {
      console.error(error)
    } finally {
      setRemoving(false)
    }
  }

  const handleAddMenuItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (addingItem) return
    setAddingItem(true)
    try {
      await onCreateMenuItem(entry.restaurant.id, newItem)
      setNewItem(MENU_ITEM_TEMPLATE)
    } catch (error) {
      console.error(error)
    } finally {
      setAddingItem(false)
    }
  }

  const rating = entry.restaurant.rating

  return (
    <div className={`card admin-restaurant-card ${expanded ? 'expanded' : ''}`}>
      <header className="admin-restaurant-head">
        <div className="admin-restaurant-title">
          <h3>{entry.restaurant.name || 'Untitled restaurant'}</h3>
          <div className="admin-restaurant-meta">
            {entry.restaurant.cuisine && <span className="pill">{entry.restaurant.cuisine}</span>}
            {rating !== undefined && rating !== null && (
              <span className="pill muted-pill">⭐ {Number(rating).toFixed(1)}</span>
            )}
            {entry.restaurant.contact && <span className="pill muted-pill">📞 {entry.restaurant.contact}</span>}
            {entry.restaurant.address && <span className="pill muted-pill">📍 {entry.restaurant.address}</span>}
          </div>
        </div>
        <div className="admin-restaurant-head-actions">
          <span className="admin-restaurant-menu-count">
            {entry.menuItems.length} menu item{entry.menuItems.length === 1 ? '' : 's'}
          </span>
          <button type="button" className="btn btn-ghost" onClick={onToggle}>
            {expanded ? 'Hide details' : 'Manage'}
          </button>
        </div>
      </header>

      {expanded && (
        <div className="admin-restaurant-body">
          <section className="admin-restaurant-section">
            <h4 className="section-title">Restaurant details</h4>
            <form className="admin-form-grid" onSubmit={handleSave}>
              <label className="field">
                <span>Name</span>
                <input
                  value={draft.name}
                  onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span>Cuisine</span>
                <input
                  value={draft.cuisine}
                  onChange={(event) => setDraft((prev) => ({ ...prev, cuisine: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span>Contact</span>
                <input
                  value={draft.contact}
                  onChange={(event) => setDraft((prev) => ({ ...prev, contact: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Address</span>
                <textarea
                  rows={2}
                  value={draft.address}
                  onChange={(event) => setDraft((prev) => ({ ...prev, address: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Rating</span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={draft.rating}
                  onChange={(event) => setDraft((prev) => ({ ...prev, rating: event.target.value }))}
                />
              </label>
              <div className="admin-form-actions">
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  Save details
                </button>
                <button className="btn btn-ghost" type="button" disabled={removing} onClick={handleDelete}>
                  Remove restaurant
                </button>
              </div>
            </form>
          </section>

          <section className="admin-restaurant-section admin-menu-section">
            <div className="admin-menu-header">
              <h4 className="section-title">Menu items</h4>
              <span className="admin-restaurant-menu-count small">
                {entry.menuItems.length} total
              </span>
            </div>

            <div className="admin-menu-list">
              {entry.menuItems.length === 0 ? (
                <p className="muted">No menu items added for this restaurant yet.</p>
              ) : (
                entry.menuItems.map((item) => (
                  <MenuItemRow
                    key={item.id}
                    item={item}
                    onUpdateMenuItem={onUpdateMenuItem}
                    onDeleteMenuItem={onDeleteMenuItem}
                  />
                ))
              )}
            </div>

            <form className="admin-menu-add" onSubmit={handleAddMenuItem}>
              <h5>Add menu item</h5>
              <div className="admin-menu-grid">
                <label className="field">
                  <span>Name</span>
                  <input
                    value={newItem.name}
                    onChange={(event) => setNewItem((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                </label>
                <label className="field">
                  <span>Price</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.price}
                    onChange={(event) => setNewItem((prev) => ({ ...prev, price: event.target.value }))}
                    required
                  />
                </label>
                <label className="field admin-menu-description">
                  <span>Description</span>
                  <textarea
                    rows={2}
                    value={newItem.description}
                    onChange={(event) => setNewItem((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>
              </div>
              <div className="admin-form-actions">
                <button className="btn btn-primary" type="submit" disabled={addingItem}>
                  Add item
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

type MenuItemRowProps = {
  item: MenuItem
  onUpdateMenuItem: (menuItemId: number, form: MenuItemForm) => Promise<void>
  onDeleteMenuItem: (menuItemId: number) => Promise<void>
}

function MenuItemRow({ item, onUpdateMenuItem, onDeleteMenuItem }: MenuItemRowProps) {
  const [draft, setDraft] = useState<MenuItemForm>(() => toMenuItemForm(item))
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    setDraft(toMenuItemForm(item))
  }, [item])

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await onUpdateMenuItem(item.id, draft)
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (removing) return
    setRemoving(true)
    try {
      await onDeleteMenuItem(item.id)
    } catch (error) {
      console.error(error)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="admin-menu-item-row">
      <label className="field">
        <span>Name</span>
        <input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} />
      </label>
      <label className="field">
        <span>Price</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={draft.price}
          onChange={(event) => setDraft((prev) => ({ ...prev, price: event.target.value }))}
        />
      </label>
      <label className="field admin-menu-description">
        <span>Description</span>
        <textarea
          rows={2}
          value={draft.description}
          onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
        />
      </label>
      <div className="admin-menu-actions">
        <button className="btn btn-primary" type="button" disabled={saving} onClick={handleSave}>
          Save
        </button>
        <button className="btn btn-ghost" type="button" disabled={removing || saving} onClick={handleRemove}>
          Remove
        </button>
      </div>
    </div>
  )
}
