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

function normalizeImagePath(path?: string | null) {
  const trimmed = path?.trim()
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed)) {
    const config = useRuntimeConfig()
    const baseUrl = config.public.imageBaseUrl

    try {
      const imageUrl = new URL(trimmed)
      const backendImageBaseUrl = new URL(`${baseUrl.replace(/\/+$/, '')}/`)

      if (imageUrl.origin !== backendImageBaseUrl.origin) return trimmed
      if (!imageUrl.pathname.startsWith(backendImageBaseUrl.pathname)) return trimmed

      const relativePath = imageUrl.pathname.slice(backendImageBaseUrl.pathname.length)
      const proxiedPath = encodePathname(relativePath)
      return proxiedPath ? `/api/images/${proxiedPath}${imageUrl.search}` : ''
    } catch {
      return ''
    }
  }

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
