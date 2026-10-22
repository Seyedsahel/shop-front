export default defineEventHandler(async (event): Promise<BrandsResponse> => {
  const raw = await backendFetch<unknown>('/home/brands', { authorization: 'none' }, event)
  return mapBrandsResponse(raw)
})
