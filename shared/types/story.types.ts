export interface StoryItem {
  id: string
  title: string,
  thumbnailUrl: string,
  mediaUrl: string
  createdAt: string
}

export interface StoriesResponse {
  items: StoryItem[]
}