export default defineEventHandler((event): Promise<Address[]> => {
  requireAddressUser(event)
  return backendFetch<Address[]>('/addresses', { authorization: 'user' }, event)
})
