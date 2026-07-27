export interface StoryItem {
  id: string
  title: string,
  thumbnailUrl: string,
  mediaUrl: string
  createdAt: number
}

export interface StoriesResponse {
  items: StoryItem[]
}