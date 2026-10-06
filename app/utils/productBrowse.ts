import type { LocationQuery } from 'vue-router'

export function getProductQueryList(value: unknown): string[] {
  const entries = Array.isArray(value) ? value : [value]
  return [...new Set(entries.flatMap(item => typeof item === 'string' ? item.split(',').map(part => part.trim()).filter(Boolean) : []))]
}

export function resolveProductFacetIds(slugs: string[], items: { id: string; slug: string }[]): string[] {
  return [...new Set(slugs.map(slug => {
    const item = items.find(item => item.slug === slug || item.id === slug)
    if (!item) throw new Error('دسته‌بندی یا برند انتخاب‌شده پیدا نشد.')
    return item.id
  }))]
}

/** The backend matches exact category IDs; include each selected subtree. */
export function expandProductCategoryIds(selectedIds: string[], categories: { id: string; parentId: string }[]): string[] {
  const expanded = new Set(selectedIds)
  const pending = [...selectedIds]
  while (pending.length) {
    const parentId = pending.pop()!
    for (const category of categories) {
      if (category.parentId === parentId && !expanded.has(category.id)) {
        expanded.add(category.id)
        pending.push(category.id)
      }
    }
  }
  return [...expanded]
}

export function parseProductBrowseQuery(query: LocationQuery) {
  const price = (value: unknown) => {
    if (value === undefined) return undefined
    if (typeof value !== 'string' || !value.trim() || !Number.isFinite(Number(value)) || Number(value) < 0) {
      throw new Error('محدوده قیمت معتبر نیست.')
    }
    return Number(value)
  }
  const priceMin = price(query.priceMin)
  const priceMax = price(query.priceMax)
  if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) throw new Error('محدوده قیمت معتبر نیست.')
  let attributeValues: Record<string, FilterValue> = {}
  if (query.filters !== undefined) {
    try {
      if (typeof query.filters !== 'string') throw new Error()
      const parsed: unknown = JSON.parse(query.filters)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
      attributeValues = Object.fromEntries(Object.entries(parsed).filter(([slug, value]) =>
        !['__proto__', 'constructor', 'prototype'].includes(slug)
        && (value === null || typeof value === 'string' || (Array.isArray(value) && value.every(item => typeof item === 'string')))
      ))
    } catch { throw new Error('فیلترهای نشانی معتبر نیستند.') }
  }
  const requestedPage = typeof query.page === 'string' ? Number(query.page) : 1
  return {
    categorySlugs: getProductQueryList(query.category),
    brandSlugs: getProductQueryList(query.brand),
    search: typeof query.search === 'string' ? query.search.trim() : '',
    discountId: typeof query.discount === 'string' ? query.discount : undefined,
    sort: typeof query.sort === 'string' ? query.sort : 'relevant',
    page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    priceMin,
    priceMax,
    attributeValues,
  }
}
