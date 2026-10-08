export interface SortOption {
  id: string
  label: string
  sortBy?: ProductSortBy
  sortDir?: 'asc' | 'desc'
}

// ProductQuery uses semantic sort keys, not database column names.
export const sortOptions: SortOption[] = [
  { id: 'relevant', label: 'مرتبط‌ترین', sortBy: 'relevance', sortDir: 'desc' },
  { id: 'newest', label: 'جدیدترین', sortBy: 'created_at', sortDir: 'desc' },
  { id: 'cheapest', label: 'ارزان‌ترین', sortBy: 'price', sortDir: 'asc' },
  { id: 'most-expensive', label: 'گران‌ترین', sortBy: 'price', sortDir: 'desc' },
]
