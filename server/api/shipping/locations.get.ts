export default defineEventHandler(async (event): Promise<ShippingProvince[]> => {
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  const locations = await backendFetch<unknown>('/shipping/locations', { authorization: 'none' }, event)
  if (!Array.isArray(locations)) throw createError({ statusCode: 502, message: 'Invalid shipping locations response from backend' })
  return locations.map((province) => {
    if (!province || typeof province !== 'object') throw createError({ statusCode: 502, message: 'Invalid shipping province from backend' })
    const value = province as Record<string, unknown>
    return { ...value, cities: Array.isArray(value.cities) ? value.cities : [] } as ShippingProvince
  })
})
