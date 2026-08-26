export default defineEventHandler(async (event): Promise<ProductListResponse> => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const params: ProductListParams = {
    category: query.category as string,
    sort: query.sort as string | undefined,
    filters: query.filters as string | undefined,
    page: query.page ? Number(query.page) : 1,
  }

  if (config.useMockData) return getMockProductList(params)

  return await backendFetch<ProductListResponse>('/catalog/product-list', { params })
})