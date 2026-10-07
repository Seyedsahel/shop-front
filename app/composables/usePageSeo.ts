export function usePageSeo(title: MaybeRefOrGetter<string>, description: MaybeRefOrGetter<string>, privatePage = false) {
  const route = useRoute()
  const config = useRuntimeConfig()
  const origin = String(config.public.siteUrl || '').replace(/\/+$/, '')
  const hasOrigin = /^https?:\/\/[^/]+/.test(origin)
  const canonical = computed(() => {
    if (!hasOrigin || privatePage) return undefined
    const params = new URLSearchParams()
    if (['/products', '/discounts/products'].includes(route.path)) {
      for (const key of ['category', 'brand', 'search', 'discount', 'priceMin', 'priceMax', 'filters', 'sort', 'page']) {
        const value = route.query[key]
        if (value) params.set(key, Array.isArray(value) ? value.join(',') : value)
      }
    }
    return origin + route.path + (params.size ? '?' + params.toString() : '')
  })
  useSeoMeta({
    title: () => toValue(title), description: () => toValue(description),
    ogTitle: () => toValue(title), ogDescription: () => toValue(description), ogUrl: () => canonical.value,
    robots: () => privatePage ? 'noindex, nofollow' : ['/products', '/discounts/products'].includes(route.path) && Object.keys(route.query).some(key => ['category', 'brand', 'search', 'discount', 'priceMin', 'priceMax', 'filters', 'sort', 'page'].includes(key)) ? 'noindex, follow' : 'index, follow',
  })
  useHead(() => ({ link: canonical.value ? [{ rel: 'canonical', href: canonical.value }] : [] }))
}
