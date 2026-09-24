export default defineEventHandler(async (event): Promise<CheckoutOrder> => {
  requireCheckoutUser(event)
  const body = await readCheckoutInput(event)
  return backendFetch<CheckoutOrder>('/api/checkout', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain' },
    authorization: 'user', retry: 0,
  }, event)
})
