export interface ProductCategory {
  id: string
  parentId: string
  name: string
  slug: string
  createdAt: number 
  updatedAt: number 
}
export interface CategoriesResponse {
  items: ProductCategory[]
}
