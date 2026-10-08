export interface AppNotification {
  id: string
  body: string
  created_at: string
  event: string
  object_id: string
  object_type: string
  read_at: string | null
}

export interface NotificationListResponse {
  items: AppNotification[]
  limit: number
  page: number
  total: number
}

export interface NotificationCounts {
  by_object_type: Record<string, number>
  unread_total: number
}
