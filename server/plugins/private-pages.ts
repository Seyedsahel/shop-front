export default defineNitroPlugin(nitro => {
  nitro.hooks.hook('beforeResponse', event => {
    const path = getRequestURL(event).pathname
    if (path.startsWith('/api/') || path.startsWith('/_nuxt/') || /\.(?:ico|png|jpe?g|webp|svg|woff2?|css|js)$/.test(path)) return
    // Authentication metadata is rendered globally. Even public routes can vary
    // by cookies, so their HTML/payload must never be shared across visitors.
    setHeader(event, 'Cache-Control', 'private, no-store')
    setHeader(event, 'Vary', 'Cookie')
  })
})
