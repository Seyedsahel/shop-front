export default defineEventHandler((event): Promise<ShippingProvince[]> => {
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return backendFetch<ShippingProvince[]>('/shipping/locations', { authorization: 'none' }, event)
})
