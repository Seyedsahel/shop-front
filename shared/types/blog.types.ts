export interface BlogPost {
  id: string
  slug: string
  title: string
  summary: string
  /** Backend media is exposed through /api/images via toBackendImageUrl(). */
  thumbnailUrl: string
  /** Unix timestamp in seconds. */
  publishedAt: number
}

export interface BlogTextBlock {
  type: 'text'
  title: string
  body: string
  sortOrder: number
}

export interface BlogImageBlock {
  type: 'image'
  title: string
  imageUrl: string
  sortOrder: number
}

export interface BlogQuoteBlock {
  type: 'quote'
  title: string
  body: string
  sortOrder: number
}

export interface BlogVideoBlock {
  type: 'video'
  title: string
  body: string
  videoUrl: string
  sortOrder: number
}

export interface BlogKeyValueItem {
  title: string
  body: string
}

export interface BlogFaqBlock {
  type: 'faq'
  title: string
  items: BlogKeyValueItem[]
  sortOrder: number
}

export interface BlogTableBlock {
  type: 'table'
  title: string
  items: BlogKeyValueItem[]
  sortOrder: number
}

export type BlogBlock = BlogTextBlock | BlogImageBlock | BlogQuoteBlock | BlogVideoBlock | BlogFaqBlock | BlogTableBlock

export interface BlogPostDetail extends BlogPost {
  blocks: BlogBlock[]
}

export interface BlogPostsResponse {
  items: BlogPost[]
  total: number
  page: number
  limit: number
}
