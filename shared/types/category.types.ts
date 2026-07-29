export interface ProductCategory {
  id: string
  slug: string
  name: string
  iconUrl: string
}
export interface CategoriesResponse {
  items: ProductCategory[]
}