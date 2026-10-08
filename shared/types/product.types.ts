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
  /** Zero means this product has no per-order quantity limit. */
  maxPerOrder: number
  createdAt?: number
  updatedAt?: number
}

/** A collection has independent backend semantics; facets stay in the URL query. */
export type ProductCollectionContext = { kind: 'catalog' } | { kind: 'discounted' }

/** Capture once and share between a browse operation's list and filter requests. */
export interface ProductBrowseContext {
  collection: ProductCollectionContext
  categoryIds?: string[]
  discountId?: string
}

/** Accepted by the backend product-query sorting contract. */
export type ProductSortBy = 'relevance' | 'created_at' | 'price'

export interface ProductListRequest {
  discountId?: string
  search?: string
  categoryIds?: string[]
  brandIds?: string[]
  priceMin?: number
  priceMax?: number
  attributeFields?: Record<string, string[]>
  page?: number
  limit?: number
  sortBy?: ProductSortBy
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
  /** Zero means this variant has no per-line quantity limit. */
  maxPerOrder: number
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

export interface ProductDescriptionBlockBase {
  title: string
  sortOrder: number
}

export interface ProductTextDescriptionBlock extends ProductDescriptionBlockBase {
  type: 'text'
  body: string
}

export interface ProductImageDescriptionBlock extends ProductDescriptionBlockBase {
  type: 'image'
  imageUrl: string
}

export interface ProductQuoteDescriptionBlock extends ProductDescriptionBlockBase {
  type: 'quote'
  body: string
}

export interface ProductVideoDescriptionBlock extends ProductDescriptionBlockBase {
  type: 'video'
  body: string
  videoUrl: string
}

export interface ProductDescriptionKeyValueItem {
  title: string
  body: string
}

export interface ProductFaqDescriptionBlock extends ProductDescriptionBlockBase {
  type: 'faq'
  items: ProductDescriptionKeyValueItem[]
}

export interface ProductTableDescriptionBlock extends ProductDescriptionBlockBase {
  type: 'table'
  items: ProductDescriptionKeyValueItem[]
}

export type ProductDescriptionBlock = ProductTextDescriptionBlock | ProductImageDescriptionBlock | ProductQuoteDescriptionBlock | ProductVideoDescriptionBlock | ProductFaqDescriptionBlock | ProductTableDescriptionBlock

export interface ProductDetail {
  id: string
  name: string
  slug: string
  description: string
  descriptionBlocks: ProductDescriptionBlock[]
  basePrice: number
  baseStock: number
  /** Zero means this product has no per-order quantity limit. */
  maxPerOrder: number
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
