export default defineEventHandler(async (event) => {
  requireCartSession(event)
  const body = await readCartItemPayload(event)
  await backendFetch(cartItemPath(event), { method: 'PATCH', body, authorization: 'session', retry: 0 }, event)
  return { success: true }
})
