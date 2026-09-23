export type CommentTargetType = 'blog' | 'product'

export interface AppComment {
    id: string
    authorName: string
    content: string
    createdAt: string
    parentId: string | null
    pending?: boolean
}

export interface CommentsResponse {
    items: AppComment[]
}

export interface SubmitCommentPayload {
    targetId: string
    targetType: CommentTargetType
    content: string
    parentId?: string
}

export interface CreatedCommentResponse {
    id: string
    body: string
    created_at: number
    parent_id: string | null
    is_confirmed: boolean
}
