export interface ShippingMethod {
  id: string
  code: string
  name: string
  enabled: boolean
  price_strategy: 'fixed' | 'free' | 'provider_quote'
  fixed_price: number
  address_requirements: Partial<Record<'address' | 'city_code' | 'phone' | 'postal_code' | 'province_code' | 'recipient_name', boolean>>
}

export interface CheckoutInput {
  address_id: string
  cart_id: string
  shipping_method_id: string
  coupon_code?: string
}

export interface CheckoutItem {
  product_id: string
  variant_id: string | null
  product_name: string
  sku: string
  unit_price: number
  quantity: number
  discount_amount: number
  total_amount: number
  available_stock?: number
  shipping_weight_grams: number
}

export interface CheckoutAddress {
  source_address_id: string
  full_name: string
  phone: string
  province: string
  city: string
  address: string
  postal_code: string
}

export interface CheckoutPreview {
  items: CheckoutItem[]
  discounts: unknown | null
  address: CheckoutAddress
  subtotal: number
  discount_amount: number
  shipping_amount: number
  tax_amount: number
  total_amount: number
  currency: string
}

export interface CheckoutOrder {
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
  items: CheckoutItem[]
  address: CheckoutAddress
  created_at: string
  updated_at: string
}
