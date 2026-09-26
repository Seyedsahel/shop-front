export default defineEventHandler(async (event): Promise<OrderListResponse> => {
  requireOrderUser(event)
  const query = getQuery(event)
  const rawPage = query.page
  const page = rawPage === undefined ? 1 : Number(rawPage)
  if (!Number.isSafeInteger(page) || page < 1) {
    throw createError({ statusCode: 400, message: 'شماره صفحه معتبر نیست.' })
  }
  const orders = await backendFetch<unknown>(`/orders?page=${page}&limit=20`, { authorization: 'user' }, event)
  if (!orders || typeof orders !== 'object' || !Array.isArray((orders as Record<string, unknown>).items)) {
    throw createError({ statusCode: 502, message: 'Invalid orders response from backend' })
  }
  return orders as OrderListResponse
})
