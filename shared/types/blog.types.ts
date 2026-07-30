export interface BlogPost{
    id: string
    slug: string
    title: string
    imageUrl: string
    excerpt: string
    publishedAt: number
}

export interface BlogPostsResponse {
    items: BlogPost[]
}