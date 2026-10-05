export default defineEventHandler(async (event): Promise<PaymentRedirect> => {
  requireOrderUser(event)
  const path = orderPath(event)
  const body = await readBody<{ method_id?: unknown }>(event)
  if (!body || typeof body.method_id !== 'string' || !body.method_id.trim()) {
    throw createError({ statusCode: 400, message: 'روش پرداخت را انتخاب کنید.' })
  }
  const result = await backendFetch<unknown>(`${path}/payments`, {
    method: 'POST', body: { method_id: body.method_id.trim() },
    headers: { 'Content-Type': 'application/json' }, authorization: 'user', retry: 0,
  }, event)
  if (!result || typeof result !== 'object'
    || typeof (result as PaymentRedirect).payment_id !== 'string'
    || typeof (result as PaymentRedirect).redirect_url !== 'string') {
    throw createError({ statusCode: 502, message: 'Invalid payment response from backend' })
  }
  let url: URL
  try { url = new URL((result as PaymentRedirect).redirect_url) }
  catch { throw createError({ statusCode: 502, message: 'Invalid payment redirect URL' }) }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw createError({ statusCode: 502, message: 'Invalid payment redirect URL' })
  }
  setResponseStatus(event, 201)
  return { payment_id: (result as PaymentRedirect).payment_id, redirect_url: url.href }
})
