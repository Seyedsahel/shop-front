export interface StoryItem {
  id: string
  title: string,
  // Backend images must be exposed through /api/images via toBackendImageUrl().
  thumbnailUrl: string,
  // Backend images must be exposed through /api/images via toBackendImageUrl().
  mediaUrl: string
  createdAt: number
}

export interface StoriesResponse {
  items: StoryItem[]
}
