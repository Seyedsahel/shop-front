type RawRecord = Record<string, unknown>

function asRecord(value: unknown): RawRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RawRecord : null
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asSortOrder(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function mapItems(value: unknown): BlogKeyValueItem[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const record = asRecord(item)
    return record ? [{ title: asString(record.title), body: asString(record.body) }] : []
  })
}

export function mapBlogPost(value: unknown): BlogPost | null {
  const post = asRecord(value)
  if (!post) return null

  const id = asString(post.id)
  const slug = asString(post.slug)
  if (!id || !slug) return null

  return {
    id,
    slug,
    title: asString(post.title),
    summary: asString(post.summary),
    thumbnailUrl: toBackendImageUrl(asString(post.thumbnail_url)),
    publishedAt: asSortOrder(post.published_at),
  }
}

function mapBlogBlock(value: unknown): BlogBlock | null {
  const block = asRecord(value)
  if (!block) return null

  const type = asString(block.type)
  const title = asString(block.title)
  const sortOrder = asSortOrder(block.sort_order)

  switch (type) {
    case 'text': return { type, title, body: asString(block.body), sortOrder }
    case 'image': return { type, title, imageUrl: toBackendImageUrl(asString(block.image_url)), sortOrder }
    case 'quote': return { type, title, body: asString(block.body), sortOrder }
    case 'video': return { type, title, body: asString(block.body), videoUrl: toBackendImageUrl(asString(block.video_url)), sortOrder }
    case 'faq': return { type, title, items: mapItems(block.items), sortOrder }
    case 'table': return { type, title, items: mapItems(block.items), sortOrder }
    default: return null
  }
}

export function mapBlogPostDetail(value: unknown): BlogPostDetail | null {
  const post = mapBlogPost(value)
  const rawPost = asRecord(value)
  if (!post || !rawPost) return null

  const blocks = Array.isArray(rawPost.blocks)
    ? rawPost.blocks.flatMap((block) => {
        const mapped = mapBlogBlock(block)
        return mapped ? [mapped] : []
      }).sort((first, second) => first.sortOrder - second.sortOrder)
    : []

  return { ...post, blocks }
}
