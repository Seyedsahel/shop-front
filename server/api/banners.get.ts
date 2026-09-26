type BannerPlacement = 'home_hero' | 'home_top' | 'home_middle'

interface BackendBanner {
  id: string
  title: string | null
  filename: string | null
  placement: BannerPlacement
  target_type: 'category' | 'brand' | null
  target_id: string | null
  target_url: string | null
  sort_order: number | null
}

function resolveTargetUrl(banner: BackendBanner) {
  const targetUrl = banner.target_url?.trim()
  if (targetUrl && (/^https?:\/\//i.test(targetUrl) || targetUrl.startsWith('/'))) return targetUrl

  if (!banner.target_id) return undefined
  const facet = banner.target_type === 'category' ? 'category' : banner.target_type === 'brand' ? 'brand' : undefined
  return facet ? `/products?${facet}=${encodeURIComponent(banner.target_id)}` : undefined
}

function mapBanners(banners: BackendBanner[]) {
  return banners
    .filter(banner => Boolean(banner.filename))
    .sort((first, second) => Number(first.sort_order ?? 0) - Number(second.sort_order ?? 0))
    .map(banner => ({
      id: banner.id,
      title: banner.title ?? '',
      imageUrl: toBackendImageUrl(banner.filename),
      href: resolveTargetUrl(banner),
      sortOrder: Number(banner.sort_order ?? 0),
    } satisfies Banner))
}

async function fetchPlacement(placement: BannerPlacement) {
  const banners = await backendFetch<BackendBanner[]>('/api/banners', {
    query: { placement },
    authorization: 'none',
  })
  return mapBanners(banners)
}

export default defineEventHandler(async (): Promise<BannersResponse> => {
  const [homeHero, homeTop, homeMiddle] = await Promise.all([
    fetchPlacement('home_hero'),
    fetchPlacement('home_top'),
    fetchPlacement('home_middle'),
  ])

  return { homeHero, homeTop, homeMiddle }
})
