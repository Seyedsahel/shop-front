export type StoryMediaType = 'image' | 'video'

/** Canonical story shape consumed by the app. */
export interface StoryItem {
  id: string
  title: string
  /** Backend media must be exposed through /api/images via toBackendImageUrl(). */
  thumbnailUrl: string
  /** Backend media must be exposed through /api/images via toBackendImageUrl(). */
  mediaUrl: string
  mediaType: StoryMediaType
  isActive: boolean
  expiresAt: number
  createdAt: number
}

export interface StoriesResponse {
  items: StoryItem[]
}

/** Raw response returned by the stories backend. Kept at the API boundary. */
export interface StoryApiItem {
  id: string
  title: string
  thumbnail_url: string
  media_url: string
  media_type: StoryMediaType
  is_active: boolean
  expires_at: number
  created_at: number
}
