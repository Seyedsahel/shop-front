export default defineEventHandler(async (event): Promise<OrderDetail> => {
  requireOrderUser(event)
  const order = await backendFetch<unknown>(orderPath(event), { authorization: 'user' }, event)
  if (!order || typeof order !== 'object' || !Array.isArray((order as Record<string, unknown>).items)) {
    throw createError({ statusCode: 502, message: 'Invalid order response from backend' })
  }
  return order as OrderDetail
})
