export type ShippingAddressRequirements = Partial<Record<'address' | 'city_code' | 'first_name' | 'last_name' | 'phone' | 'postal_code' | 'province_code' | 'recipient_name', boolean>>

export interface ShippingMethod {
  id: string
  code: string
  name: string
  enabled: boolean
  price_strategy: 'fixed' | 'free' | 'provider_quote'
  fixed_price: number
  address_requirements: ShippingAddressRequirements
}

export type CheckoutInlineAddress = Partial<Omit<AddressInput, 'name'>>

export type CheckoutInput = {
  cart_id: string
  shipping_method_id: string
  coupon_code?: string
  torob_clid?: string
} & ({ address_id: string; address?: never } | { address: CheckoutInlineAddress; address_id?: never })

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
  status: string
  total_amount: number
  currency: string
}

export interface CheckoutAttempt {
  key: string
  input: CheckoutInput
  /** A definite rejection allows editing; an unchanged retry still uses this key. */
  rejected?: boolean
  orderId?: string
  paymentMethodId?: string
  paymentUncertain?: boolean
  paymentBlocked?: boolean
  checkoutExpired?: boolean
}
