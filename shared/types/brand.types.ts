export interface Brand {
  id: string
  name: string
  logoUrl: string
  href?: string
}
export interface BrandsResponse {
  items: Brand[]
}