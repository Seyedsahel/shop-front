export default defineEventHandler(async (event): Promise<CheckoutPreview> => {
  requireCheckoutUser(event)
  const body = await readCheckoutInput(event)
  const preview = await backendFetch<unknown>('/checkout/preview', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain' },
    authorization: 'user', retry: 0,
  }, event)
  if (!preview || typeof preview !== 'object' || !Array.isArray((preview as Record<string, unknown>).items)
    || !(preview as Record<string, unknown>).address || typeof (preview as Record<string, unknown>).address !== 'object') {
    throw createError({ statusCode: 502, message: 'Invalid checkout preview response from backend' })
  }
  return preview as CheckoutPreview
})
