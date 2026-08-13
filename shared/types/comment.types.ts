export type CommentTargetType = 'blog' | 'product'

export interface AppComment {
    id: string
    authorName: string
    content: string
    createdAt: string
}

export interface CommentsResponse {
    items: AppComment[]
}

export interface SubmitCommentPayload {
    targetId: string
    targetType: CommentTargetType
    content: string
}