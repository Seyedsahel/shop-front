export default defineEventHandler(async (event): Promise<Address[]> => {
  requireAddressUser(event)
  const addresses = await backendFetch<unknown>('/addresses', { authorization: 'user' }, event)
  if (!Array.isArray(addresses)) throw createError({ statusCode: 502, message: 'Invalid addresses response from backend' })
  return addresses as Address[]
})
