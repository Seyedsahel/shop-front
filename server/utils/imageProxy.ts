function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function encodePathname(pathname: string) {
  return pathname
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(safeDecodeURIComponent(segment)))
    .join('/')
}

// Uploads are served by the API application; catalog images have a separate base.
export function backendMediaBaseUrls() {
  const config = useRuntimeConfig()
  return {
    images: `${config.public.imageBaseUrl.replace(/\/+$/, '')}/`,
    uploads: `${config.backendUrl.replace(/\/+$/, '')}/tbt/`,
  }
}

export function resolveBackendMediaUrl(path: string, search = '') {
  const segments = path.split('/').filter(Boolean).map((segment) => {
    try {
      return decodeURIComponent(segment)
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid media path' })
    }
  })
  if (!segments.length || segments.some(segment => segment === '.' || segment === '..' || /[/\\\u0000]/.test(segment))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid media path' })
  }
  const bases = backendMediaBaseUrls()
  const url = new URL(segments.map(segment => encodeURIComponent(segment)).join('/'), segments[0] === 'uploads' ? bases.uploads : bases.images)
  url.search = search
  return url.toString()
}

function normalizeImagePath(path?: string | null) {
  const trimmed = path?.trim()
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const imageUrl = new URL(trimmed)
      const bases = backendMediaBaseUrls()
      const base = [new URL('uploads/', bases.uploads), new URL(bases.images)].find(base =>
        imageUrl.origin === base.origin && imageUrl.pathname.startsWith(base.pathname))
      if (!base) return trimmed
      const relativePath = imageUrl.pathname.slice(base.pathname.length)
      const prefix = base.pathname.endsWith('/uploads/') ? 'uploads/' : ''
      const proxiedPath = encodePathname(prefix + relativePath)
      return proxiedPath ? `/api/images/${proxiedPath}${imageUrl.search}` : ''
    } catch {
      return ''
    }
  }

  if (trimmed.startsWith('/api/images/')) return trimmed

  const relativePath = trimmed.replace(/^\/+/, '')
  const queryIndex = relativePath.indexOf('?')
  const pathname = queryIndex === -1 ? relativePath : relativePath.slice(0, queryIndex)
  const query = queryIndex === -1 ? '' : relativePath.slice(queryIndex + 1)
  const proxiedPath = encodePathname(pathname)

  if (!proxiedPath) return ''

  return query ? `/api/images/${proxiedPath}?${query}` : `/api/images/${proxiedPath}`
}

export function toBackendImageUrl(path?: string | null) {
  return normalizeImagePath(path)
}
