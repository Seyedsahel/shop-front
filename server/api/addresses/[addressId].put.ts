export default defineEventHandler(async (event): Promise<Address> => {
  requireAddressUser(event)
  const path = addressPath(event)
  const body = await readAddressInput(event)
  return backendFetch<Address>(path, {
    method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain' },
    authorization: 'user', retry: 0,
  }, event)
})
