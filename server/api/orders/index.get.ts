export default defineEventHandler((event): Promise<OrderListResponse> => {
  requireOrderUser(event)
  const query = getQuery(event)
  const rawPage = query.page
  const page = rawPage === undefined ? 1 : Number(rawPage)
  if (!Number.isSafeInteger(page) || page < 1) {
    throw createError({ statusCode: 400, message: 'شماره صفحه معتبر نیست.' })
  }
  return backendFetch<OrderListResponse>(`/orders?page=${page}&limit=20`, { authorization: 'user' }, event)
})
