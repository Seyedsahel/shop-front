export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string     
  // Backend images must be exposed through /api/images via toBackendImageUrl().
  imageUrl: string
  publishedAt: number
}
export interface BlogPostsResponse {
  items: BlogPost[]
}
