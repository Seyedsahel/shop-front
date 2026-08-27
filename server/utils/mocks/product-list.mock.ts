// Reuses existing mockProductsResponse.items as the full pool for mock filtering/sorting.
export function getMockProductList(params: ProductListParams): ProductListResponse {
  let items = mockProductsResponse.items

  if (params.category) {
    items = items.filter(p => p.category === params.category)
  }

  if (params.brand) {
    items = items.filter(p => p.brand === params.brand)
  }

  if (params.sort === 'cheapest') items = [...items].sort((a, b) => a.price - b.price)
  if (params.sort === 'most-expensive') items = [...items].sort((a, b) => b.price - a.price)
  // other sort ids are no-ops on mock data — real backend will implement them properly

  const pageSize = 12
  const page = params.page ?? 1
  const start = (page - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  }
}