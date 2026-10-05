export default defineEventHandler(async (event): Promise<PaymentMethod[]> => {
  setHeader(event, 'Cache-Control', 'no-store')
  const methods = await backendFetch<unknown>('/payment-methods', { authorization: 'none' }, event)
  if (!Array.isArray(methods) || methods.some(method => !method
    || ['id', 'code', 'name', 'provider'].some(key => typeof method[key] !== 'string'))) {
    throw createError({ statusCode: 502, message: 'Invalid payment methods response from backend' })
  }
  return methods.map(({ id, code, name, provider }) => ({ id, code, name, provider }))
})
