export function isAvailableStory(story: StoryApiItem, now = Math.floor(Date.now() / 1000)) {
  return story.is_active && story.expires_at > now
}

export function mapStory(story: StoryApiItem): StoryItem {
  return {
    id: story.id,
    title: story.title,
    thumbnailUrl: toBackendImageUrl(story.thumbnail_url),
    mediaUrl: toBackendImageUrl(story.media_url),
    mediaType: story.media_type,
    isActive: story.is_active,
    expiresAt: story.expires_at,
    createdAt: story.created_at,
  }
}
