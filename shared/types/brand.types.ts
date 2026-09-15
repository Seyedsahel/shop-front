export interface Brand {
  id: string
  name: string
  slug: string
  imageUrl: string
  description: string
  createdAt: number
  updatedAt: number
}

export interface BrandsResponse {
  items: Brand[]
}
