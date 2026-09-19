export default defineEventHandler(async (event) => {
  requireCartSession(event)
  const body = await readCartItemPayload(event)
  await backendFetch('/api/cart/items', { method: 'POST', body, authorization: 'session', retry: 0 }, event)
  setResponseStatus(event, 201)
  return { success: true }
})
