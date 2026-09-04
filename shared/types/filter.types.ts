export type FilterDataType = 'select' | 'multiselect' | 'string' | 'boolean'

export interface FilterDefinition {
  slug: string
  name: string
  dataType: FilterDataType
  availableValues: string[]
}

export interface FiltersResponse {
  items: FilterDefinition[]
  total: number
  page: number
  limit: number
}

// select/string → radio (backend calls them different types but both are single-choice from a fixed list)
// multiselect → checkbox
// boolean → toggle, values are literally "true"/"false" strings
export type FilterValue = string | string[] | boolean | null