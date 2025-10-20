export type Restaurant = {
  id: number
  name: string
  cuisine: string
  rating?: number | null
  address?: string | null
  contact?: string | null
}

export type MenuItem = {
  id: number
  name: string
  description?: string | null
  price: number | null
  restaurantId?: number | null
  image?: string | null
}

export type CartItem = MenuItem & {
  quantity: number
}

export type UserSession = {
  userId: number
  email: string
  roles: string[]
}

export type OrderItemSummary = {
  id: number
  quantity: number
  menuItem?: MenuItem | null
}

export type OrderSummaryPayload = {
  id: number
  orderDate?: string
  deliveryAddress?: string
  status?: string
  totalAmount?: number | null
  paymentStatus?: string
  paymentQrCode?: string
  restaurant?: Restaurant | null
  items?: OrderItemSummary[]
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

export type AdminOrder = {
  id: number
  status: OrderStatus
  totalAmount?: number | null
  deliveryAddress?: string | null
  orderDate?: string | null
  paymentStatus?: string | null
  paymentMethod?: string | null
  paymentQrCode?: string | null
  restaurant?: { id: number; name: string | null }
  user?: { id: number; name?: string | null; email?: string | null }
  driver?: { id: number; name?: string | null; available?: boolean | null }
  items: Array<{
    id: number
    quantity: number
    menuItem?: { id: number; name?: string | null; price?: number | null }
  }>
}

export type AdminRestaurantEntry = {
  restaurant: Restaurant
  menuItems: MenuItem[]
}

export type AdminDriver = {
  id: number
  name?: string | null
  contact?: string | null
  available?: boolean | null
  user?: { id: number; email?: string | null }
  assignedOrderCount?: number
  activeOrderCount?: number
}

export type DriverProfile = {
  id: number
  name?: string | null
  contact?: string | null
  available: boolean
  user?: { id: number; email?: string | null }
}

export type DriverOrder = {
  id: number
  status?: string | null
  deliveryAddress?: string | null
  totalAmount?: number | null
  orderDate?: string | null
  restaurant?: { id: number; name?: string | null; contact?: string | null }
  customer?: { id: number; name?: string | null; phone?: string | null }
  items: Array<{
    id: number
    quantity: number
    menuItem?: { id: number; name?: string | null; price?: number | null }
  }>
}
