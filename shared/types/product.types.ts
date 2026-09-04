// shared/types/product.types.ts

// ---- List item (from /api/products/list) ----
export interface Product {
  id: string
  productTypeId: string
  name: string
  slug: string
  thumbnailUrl: string | null   // relative path from backend, e.g. "products/abc.jpg"
  imageUrl: string              // full URL, built in the server proxy
  description: string
  basePrice: number
  stock: number
  createdAt: number
  updatedAt: number
}

export interface ProductListRequest {
  search?: string
  categoryIds?: string[]
  priceMin?: number
  priceMax?: number
  attributeFields?: Record<string, string[]>
  page?: number
  limit?: number
  sortBy?: string   // e.g. 'base_price' — omit for backend's default relevance sort
  sortDir?: 'asc' | 'desc'
}

export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  limit: number
}

// ---- Detail (from /api/products/{slug}/detail) ----
export interface ProductDetailImage {
  imageUrl: string       // full URL, built in the server proxy
  sortOrder: number
  isThumbnail: boolean
}

export interface ProductDetailCategory {
  id: string
  name: string
  slug: string
}

export interface ProductSpecification {
  attributeId: string
  slug: string
  name: string
  dataType: string
  unit: string
  value: string
}

export interface ProductVariant {
  variantId: string
  attributeId: string
  slug: string
  name: string
  value: string
  priceAdjustment: number
  finalPrice: number
  stock: number
}

export interface ProductDetail {
  id: string
  name: string
  slug: string
  description: string
  basePrice: number
  baseStock: number
  images: ProductDetailImage[]
  categories: ProductDetailCategory[]
  specifications: ProductSpecification[]
  purchaseVariants: ProductVariant[]
}