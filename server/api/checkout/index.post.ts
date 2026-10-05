export default defineEventHandler(async (event): Promise<CheckoutOrder> => {
  requireCheckoutUser(event)
  const body = await readCheckoutInput(event)
  const key = getHeader(event, 'Idempotency-Key')
  if (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    throw createError({ statusCode: 400, message: 'کلید ثبت سفارش معتبر نیست.' })
  }
  const order = await backendFetch<unknown>('/checkout', {
    method: 'POST', body, headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    authorization: 'user', retry: 0,
  }, event)
  if (!order || typeof order !== 'object'
    || typeof (order as Record<string, unknown>).id !== 'string'
    || typeof (order as Record<string, unknown>).order_number !== 'string'
    || typeof (order as Record<string, unknown>).status !== 'string'
    || typeof (order as Record<string, unknown>).total_amount !== 'number'
    || typeof (order as Record<string, unknown>).currency !== 'string') {
    throw createError({ statusCode: 502, message: 'Invalid checkout order response from backend' })
  }
  setResponseStatus(event, 201)
  return order as CheckoutOrder
})
