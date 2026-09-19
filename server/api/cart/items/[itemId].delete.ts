export default defineEventHandler(async (event) => {
  requireCartSession(event)
  await backendFetch(cartItemPath(event), { method: 'DELETE', authorization: 'session', retry: 0 }, event)
  return { success: true }
})
