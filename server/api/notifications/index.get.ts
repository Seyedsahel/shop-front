export default defineEventHandler(async (event): Promise<NotificationListResponse> => {
  requireNotificationUser(event)
  const query = getQuery(event)
  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? 20 : Number(query.limit)
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw createError({ statusCode: 400, message: 'صفحه یا تعداد اعلان‌ها معتبر نیست.' })
  }
  return backendFetch<NotificationListResponse>(`/notifications?page=${page}&limit=${limit}`, { authorization: 'user' }, event)
})
