export type Restaurant = {
  id: number
  name: string
  cuisine: string
  rating?: number | null
}

export type MenuItem = {
  id: number
  name: string
  description: string
  price: number | null
}

export type CartItem = MenuItem & {
  quantity: number
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
  restaurant?: Restaurant | null
  items?: OrderItemSummary[]
}
