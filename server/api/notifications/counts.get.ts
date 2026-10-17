export default defineEventHandler(async (event): Promise<NotificationCounts> => {
  requireNotificationUser(event)
  const response = await backendFetch<unknown>('/notifications/counts', { authorization: 'user' }, event)
  if (Array.isArray(response) && response.length === 0) return { by_object_type: {}, unread_total: 0 }
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    throw createError({ statusCode: 502, message: 'Invalid notification counts response from backend' })
  }
  const counts = response as NotificationCounts
  if (!Number.isSafeInteger(counts.unread_total) || counts.unread_total < 0 || !counts.by_object_type || typeof counts.by_object_type !== 'object') {
    throw createError({ statusCode: 502, message: 'Invalid notification counts response from backend' })
  }
  if (Array.isArray(counts.by_object_type) && counts.by_object_type.length === 0) return { ...counts, by_object_type: {} }
  if (Array.isArray(counts.by_object_type)) throw createError({ statusCode: 502, message: 'Invalid notification counts response from backend' })
  return counts
})
