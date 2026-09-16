export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  if (!path) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found' })
  }

  const segments = path.split('/').filter(Boolean).map((segment) => {
    try {
      return decodeURIComponent(segment)
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid image path' })
    }
  })

  if (!segments.length || segments.some(segment => segment === '..' || segment.includes('/') || segment.includes('\\'))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image path' })
  }

  const config = useRuntimeConfig()
  const baseUrl = config.public.imageBaseUrl
  if (!baseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Image backend is not configured' })
  }

  const requestUrl = getRequestURL(event)
  const imageUrl = new URL(segments.map(segment => encodeURIComponent(segment)).join('/'), `${baseUrl.replace(/\/+$/, '')}/`)
  imageUrl.search = requestUrl.search

  const response = await $fetch.raw<ArrayBuffer>(imageUrl.toString(), {
    responseType: 'arrayBuffer',
  })

  const headersToForward = ['content-type', 'cache-control', 'etag', 'last-modified']
  for (const header of headersToForward) {
    const value = response.headers.get(header)
    if (value) setResponseHeader(event, header, value)
  }

  if (!response.headers.get('cache-control')) {
    setResponseHeader(event, 'cache-control', 'public, max-age=86400')
  }
  const data = response._data

  if (!data) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Image backend returned an empty response',
    })
  }

  return Buffer.from(data)

})
