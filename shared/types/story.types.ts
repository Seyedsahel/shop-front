export interface StoryItem {
  id: string
  mediaUrl: string
  createdAt: string
}

export interface StoriesResponse {
  adminAvatarUrl: string
  items: StoryItem[]
}