export interface Product {
  id: string
  slug: string
  name: string
  imageUrl: string
  category : string
  price: number
  compareAtPrice?: number
  quantity : number
  inStock: boolean
}

export interface AddCartItemPayload {
  productId: string
  quantity: number
}

export interface ProductsResponse {
    items: Product[]
}


export interface ProductListParams {
  category: string
  sort?: string
  filters?: string   // JSON-encoded filter values, passed straight through in the query
  page?: number
}
export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  pageSize: number
}