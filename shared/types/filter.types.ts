export type FilterDataType = 'select' | 'multiselect' | 'string' | 'boolean'

export interface FilterDefinition {
  slug: string
  name: string
  dataType: FilterDataType
  availableValues: string[]
}

export interface FilterBrandOption {
  id: string
  name: string
  slug: string
  // Backend images must be exposed through /api/images via toBackendImageUrl().
  imageUrl: string
}

export interface FilterCategoryOption {
  id: string
  parentId: string
  name: string
  slug: string
  // Backend images must be exposed through /api/images via toBackendImageUrl().
  imageUrl: string
}

export interface FilterPriceRange {
  min: number
  max: number
}

export interface FiltersResponse {
  attributes: FilterDefinition[]
  brands: FilterBrandOption[]
  categories: FilterCategoryOption[]
  priceRange: FilterPriceRange
  total: number
  page: number
  limit: number
}

export interface ProductFiltersRequest {
  categoryIds?: string[]
  discountId?: string
  limit?: number
}

// select/string → radio (backend calls them different types but both are single-choice from a fixed list)
// multiselect → checkbox
// boolean → toggle, values are literally "true"/"false" strings
export type FilterValue = string | string[] | null
