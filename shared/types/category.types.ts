export interface ProductCategory {
  id: string
  parentId: string
  imageUrl: string
  name: string
  slug: string
  createdAt: number 
  updatedAt: number 
}
export interface CategoriesResponse {
  items: ProductCategory[]
}
