export default defineEventHandler((event): Promise<OrderDetail> => {
  requireOrderUser(event)
  return backendFetch<OrderDetail>(orderPath(event), { authorization: 'user' }, event)
})
