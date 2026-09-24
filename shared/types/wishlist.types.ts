export interface WishlistItem {
  id: string
  product_id: string
  variant_id: string
  name: string
  slug: string
  stock: number
  image_url: string | null
  price: {
    original: number
    final: number
    discount: number
    discount_percent: number
  }
}

export interface WishlistResponse {
  id: string
  guest_id: string
  user_id: string
  products: Record<string, WishlistItem>
}

export interface WishlistItemPayload {
  product_id: string
  variant_id?: string
}
