export interface SortOption {
  id: string
  label: string
}

// Static and admin-fixed for now — if this ever becomes backend-configurable,
// it moves to server/api + a store exactly like filters did.
export const sortOptions: SortOption[] = [
  { id: 'relevant', label: 'مرتبط‌ترین' },
  { id: 'most-viewed', label: 'پربازدیدترین' },
  { id: 'newest', label: 'جدیدترین' },
  { id: 'best-selling', label: 'پرفروش‌ترین' },
  { id: 'cheapest', label: 'ارزان‌ترین' },
  { id: 'most-expensive', label: 'گران‌ترین' },
  { id: 'fastest-shipping', label: 'سریع‌ترین ارسال' },
]