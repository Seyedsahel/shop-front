export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string     
  imageUrl: string
  publishedAt: number
}
export interface BlogPostsResponse {
  items: BlogPost[]
}