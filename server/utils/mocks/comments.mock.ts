const mockComments: Record<string, AppComment[]> = {
  'blog:1': [
    { id: 'c1', authorName: 'تست', content: 'خیلی مفید بود، ممنون از توضیحات کامل.', createdAt: '2026-07-11' },
    { id: 'c2', authorName: 'تست', content: 'من همین روتین رو امتحان کردم، واقعا جواب داد.', createdAt: '2026-07-12' },
  ],
}

export function getMockComments(targetType: string, targetId: string): AppComment[] {
  return mockComments[`${targetType}:${targetId}`] ?? []
}