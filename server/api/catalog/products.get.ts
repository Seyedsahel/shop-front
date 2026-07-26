export default defineEventHandler(async (event): Promise<ProductsResponse> => {
  const config = useRuntimeConfig()
  const { category } = getQuery(event)

  const allproducts = config.useMockData
    ? mockProductsResponse
    : await backendFetch<ProductsResponse>('/catalog/products')

  if (!category) return allproducts
  return { items: allproducts.items.filter(p => p.category === category) }
})