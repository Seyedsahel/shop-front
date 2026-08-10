export interface CartItem {
  productId: string
  quantity: number
}
export interface CartResponse {
  items: CartItem[]
}