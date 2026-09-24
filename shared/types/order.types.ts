export interface OrderSummary {
  id: string
  order_number: string
  user_id: string
  status: string
  subtotal: number
  discount_amount: number
  shipping_amount: number
  shipping_method_id: string
  shipping_method_name: string
  shipping_method_code: string
  tax_amount: number
  total_amount: number
  currency: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  product_name: string
  sku: string
  unit_price: number
  quantity: number
  discount_amount: number
  total_amount: number
  shipping_weight_grams: number
  created_at: string
}

export interface OrderDetail extends OrderSummary {
  items: OrderItem[]
}

export interface OrderListResponse {
  items: OrderSummary[]
  total: number
  page: number
  limit: number
}
