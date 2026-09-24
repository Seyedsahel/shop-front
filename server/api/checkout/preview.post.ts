export default defineEventHandler(async (event): Promise<CheckoutPreview> => {
  requireCheckoutUser(event)
  const body = await readCheckoutInput(event)
  return backendFetch<CheckoutPreview>('/api/checkout/preview', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain' },
    authorization: 'user', retry: 0,
  }, event)
})
