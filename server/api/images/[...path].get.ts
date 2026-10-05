export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  if (!path) throw createError({ statusCode: 404, statusMessage: 'Media not found' })

  const mediaUrl = resolveBackendMediaUrl(path, getRequestURL(event).search)
  const headers: Record<string, string> = {}
  for (const name of ['range', 'if-range', 'if-none-match', 'if-modified-since']) {
    const value = getRequestHeader(event, name)
    if (value) headers[name] = value
  }

  // Stream media and preserve upstream 206/304/404 responses and range headers.
  return sendProxy(event, mediaUrl, {
    headers,
    fetchOptions: { method: event.method },
    onResponse(_event, response) {
      if (response.ok && !response.headers.has('cache-control')) {
        setResponseHeader(event, 'cache-control', 'public, max-age=86400')
      }
    },
  })
})
