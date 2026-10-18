export default defineEventHandler(async (event): Promise<ShippingMethod[]> => {
  setHeader(event, 'Cache-Control', 'no-store')
  const methods = await backendFetch<unknown>('/shipping/methods', { authorization: 'none' }, event)
  if (!Array.isArray(methods)) throw createError({ statusCode: 502, message: 'Invalid shipping methods response from backend' })
  setHeader(event, 'Cache-Control', 'public, max-age=300')
  return methods as ShippingMethod[]
})
