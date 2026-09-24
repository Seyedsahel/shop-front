export default defineEventHandler(async (event): Promise<Address> => {
  requireAddressUser(event)
  const body = await readAddressInput(event)
  return backendFetch<Address>('/api/addresses', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain' },
    authorization: 'user', retry: 0,
  }, event)
})
