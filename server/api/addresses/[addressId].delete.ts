export default defineEventHandler(async (event) => {
  requireAddressUser(event)
  await backendFetch(addressPath(event), { method: 'DELETE', authorization: 'user', retry: 0 }, event)
  return { success: true }
})
