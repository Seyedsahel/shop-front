// shared/types/product.types.ts

// ---- List item (from /api/products/list) ----
export interface ProductPrice {
  original: number
  final: number
  discount: number
  discountPercent: number
}

export interface Product {
  id: string
  productTypeId?: string | null
  name: string
  slug: string
  brandId: string
  thumbnailUrl: string | null   // relative path from backend, e.g. "products/abc.jpg"
  imageUrl: string              // proxied URL, e.g. "/api/images/products/abc.jpg"
  description: string
  basePrice: number
  price: ProductPrice
  stock: number
  createdAt?: number
  updatedAt?: number
}

export interface ProductListRequest {
  discountId?: string
  discountedOnly?: boolean
  search?: string
  categoryIds?: string[]
  brandIds?: string[]
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
  imageUrl: string       // proxied URL, e.g. "/api/images/products/abc.jpg"
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

export interface ProductVariantOption {
  variantOptionId: string
  attributeId: string
  slug: string
  name: string
  value: string
}

export interface ProductVariant {
  variantId: string
  sku: string
  priceAdjustment: number
  finalPrice: number
  stock: number
  options: ProductVariantOption[]
}

export interface ProductDetailPrice {
  original: number
  final: number
  discount: number
  discountPercent: number
}

export interface ProductDetailBrand {
  id: string
  name: string
  slug: string
  fileId: string | null
  description: string
}

export interface ProductDescriptionBlock {
  type: string
  title: string
  body: string
  sortOrder: number
}

export interface ProductDetail {
  id: string
  name: string
  slug: string
  description: string
  descriptionBlocks: ProductDescriptionBlock[]
  basePrice: number
  baseStock: number
  price: ProductDetailPrice
  brand: ProductDetailBrand | null
  images: ProductDetailImage[]
  categories: ProductDetailCategory[]
  specifications: ProductSpecification[]
  purchaseVariants: ProductVariant[]
}

/** Fields used from GET /api/products/{id} before requesting slug-based details. */
export interface BackendProductLookupResponse {
  id: string
  slug: string
  thumbnail_url: string | null
}
