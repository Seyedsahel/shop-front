export default defineEventHandler(async (event): Promise<CheckoutOrder> => {
  requireCheckoutUser(event)
  const body = await readCheckoutInput(event)
  const order = await backendFetch<unknown>('/checkout', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain' },
    authorization: 'user', retry: 0,
  }, event)
  if (!order || typeof order !== 'object' || !Array.isArray((order as Record<string, unknown>).items)
    || !(order as Record<string, unknown>).address || typeof (order as Record<string, unknown>).address !== 'object') {
    throw createError({ statusCode: 502, message: 'Invalid checkout order response from backend' })
  }
  return order as CheckoutOrder
})
