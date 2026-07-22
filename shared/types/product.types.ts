export interface Product {
  id: string
  slug: string
  name: string
  imageUrl: string
  category : string
  price: number
  compareAtPrice?: number
  inStock: boolean
}

export interface AddCartItemPayload {
  productId: string
  quantity: number
}