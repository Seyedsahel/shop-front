export interface SortOption {
  id: string
  label: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

// Only options with a confirmed backend mapping actually sort;
// 'relevant' and anything unmapped omits sort_by/sort_dir entirely.
export const sortOptions: SortOption[] = [
  { id: 'relevant', label: 'مرتبط‌ترین' },
  { id: 'newest', label: 'جدیدترین', sortBy: 'created_at', sortDir: 'desc' },
  { id: 'cheapest', label: 'ارزان‌ترین', sortBy: 'base_price', sortDir: 'asc' },
  { id: 'most-expensive', label: 'گران‌ترین', sortBy: 'base_price', sortDir: 'desc' },
]