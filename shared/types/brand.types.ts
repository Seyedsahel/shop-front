export interface Brand {
  id: string
  name: string
  slug: string
  // Backend images must be exposed through /api/images via toBackendImageUrl().
  imageUrl: string
  description: string
  createdAt: number
  updatedAt: number
}

export interface BrandsResponse {
  items: Brand[]
}
