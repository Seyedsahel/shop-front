export default defineEventHandler((event): Promise<Address[]> => {
  requireAddressUser(event)
  return backendFetch<Address[]>('/api/addresses', { authorization: 'user' }, event)
})
