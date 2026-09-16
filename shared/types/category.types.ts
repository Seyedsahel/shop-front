export interface ProductCategory {
  id: string
  parentId: string
  // Backend images must be exposed through /api/images via toBackendImageUrl().
  imageUrl: string
  name: string
  slug: string
  createdAt: number 
  updatedAt: number 
}
export interface CategoriesResponse {
  items: ProductCategory[]
}
