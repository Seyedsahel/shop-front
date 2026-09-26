export default defineEventHandler((event): Promise<ShippingMethod[]> => {
  setHeader(event, 'Cache-Control', 'public, max-age=300')
  return backendFetch<ShippingMethod[]>('/shipping/methods', { authorization: 'none' }, event)
})
