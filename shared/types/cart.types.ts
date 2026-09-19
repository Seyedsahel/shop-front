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
  variant_id: string | null
  quantity: number
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
  cart_token: string
  user_id: string
  products: Record<string, CartItem>
  pricing: CartPricing
}
export interface CartItemPayload {
  product_id: string
  quantity: number
  variant_id: string | null
}
/** Product presentation is enriched by the Nuxt proxy, never used for cart pricing. */
export interface CartViewResponse extends CartResponse {
  presentation: Record<string, ProductDetail | null>
}
export interface CartUiItem extends CartItem {
  name: string | null
  slug: string | null
  imageUrl: string | null
  description: string
  stock: number | null
  presentationUnavailable: boolean
}
