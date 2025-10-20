import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import api from '../api'
import type { CartItem, MenuItem, Restaurant, UserSession } from '../types'

interface AppContextValue {
  user: UserSession | null
  authenticate: (session: UserSession) => void
  logout: () => void
  isAdmin: boolean
  isDriver: boolean

  selectedRestaurant: Restaurant | null
  selectRestaurant: (restaurant: Restaurant | null) => void

  cart: CartItem[]
  addToCart: (item: MenuItem) => void
  updateQuantity: (menuItemId: number, quantity: number) => void
  removeFromCart: (menuItemId: number) => void
  clearCart: () => void

  placeOrder: (deliveryAddress?: string, paymentMethod?: string) => Promise<{ paymentQrCode?: string; paymentStatus?: string; orderId?: number }>
  historyRefreshKey: number
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [historyRefreshKey, setHistoryRefreshKey] = useState<number>(Date.now())

  const authenticate = useCallback((session: UserSession) => {
    setUser(session)
    setHistoryRefreshKey(Date.now())
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setSelectedRestaurant(null)
    setCart([])
    setHistoryRefreshKey(Date.now())
  }, [])

  const selectRestaurant = useCallback((restaurant: Restaurant | null) => {
    setSelectedRestaurant((previous) => {
      const previousId = previous?.id ?? null
      const nextId = restaurant?.id ?? null
      if (previousId !== nextId) {
        setCart([])
      }
      return restaurant
    })
  }, [])

  const addToCart = useCallback((item: MenuItem) => {
    setCart((previous) => {
      const price = typeof item.price === 'number' ? item.price : item.price ? Number(item.price) : 0
      const existing = previous.find((entry) => entry.id === item.id)
      if (existing) {
        return previous.map((entry) => (entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry))
      }
      return [...previous, { ...item, price, quantity: 1 }]
    })
  }, [])

  const updateQuantity = useCallback((menuItemId: number, quantity: number) => {
    setCart((previous) =>
      previous.map((entry) => (entry.id === menuItemId ? { ...entry, quantity: Math.max(1, quantity) } : entry)),
    )
  }, [])

  const removeFromCart = useCallback((menuItemId: number) => {
    setCart((previous) => previous.filter((entry) => entry.id !== menuItemId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const placeOrder = useCallback(
    async (deliveryAddress?: string, paymentMethod?: string) => {
      if (!user) throw new Error('Please sign in to place an order.')
      if (!selectedRestaurant) throw new Error('Select a restaurant to continue.')
      if (cart.length === 0) throw new Error('Add items to your cart first.')

      const payload = {
        userId: user.userId,
        restaurantId: selectedRestaurant.id,
        items: cart.map((entry) => ({ menuItemId: entry.id, quantity: entry.quantity })),
        ...(deliveryAddress ? { deliveryAddress } : {}),
        ...(paymentMethod ? { paymentMethod } : {}),
      }

      const response = await api.post<{ orderId: number; paymentQrCode?: string; paymentStatus?: string }>('/orders', payload)
      setHistoryRefreshKey(Date.now())
      return {
        orderId: response.data.orderId,
        paymentQrCode: response.data.paymentQrCode,
        paymentStatus: response.data.paymentStatus
      }
    },
    [cart, selectedRestaurant, user],
  )

  const isAdmin = useMemo(() => user?.roles?.includes('ROLE_ADMIN') ?? false, [user])
  const isDriver = useMemo(() => user?.roles?.includes('ROLE_DRIVER') ?? false, [user])

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      authenticate,
      logout,
      isAdmin,
      isDriver,
      selectedRestaurant,
      selectRestaurant,
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      placeOrder,
      historyRefreshKey,
    }),
    [
      user,
      authenticate,
      logout,
      selectedRestaurant,
      selectRestaurant,
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      placeOrder,
      historyRefreshKey,
      isAdmin,
      isDriver,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
