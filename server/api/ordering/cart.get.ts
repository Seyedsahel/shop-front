export default defineEventHandler(async (event): Promise<CartResponse> => {
  const config = useRuntimeConfig()
  return config.useMockData ? mockCartResponse : await backendFetch<CartResponse>('/ordering/cart')
})