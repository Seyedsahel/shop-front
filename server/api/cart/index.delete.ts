export default defineEventHandler(async (event) => {
  requireCartSession(event)
  await backendFetch('/cart', { method: 'DELETE', authorization: 'session', retry: 0 }, event)
  return { success: true }
})
