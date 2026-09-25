export interface CartItemPricing {
  original_unit: number
  final_unit: number
  original_total: number
  discount: number
  total: number
}
export interface CartItem {
  id: string
  product_id: string
  variant_id: string
  variant_name: string
  quantity: number
  name: string
  slug: string
  stock: number
  /** Zero means this product has no per-order quantity limit. */
  max_per_order: number
  image_url: string | null
  pricing: CartItemPricing
}
export interface CartPricing {
  subtotal_original: number
  discount: number
  subtotal: number
  total: number
}
export interface CartResponse {
  id: string
  guest_id: string
  user_id: string
  products: Record<string, CartItem>
  pricing: CartPricing
}
export interface CartItemPayload {
  product_id: string
  quantity: number
  variant_id: string | null
}
