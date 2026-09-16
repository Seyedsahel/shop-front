export interface Banner {
  id: string
  // Backend images must be exposed through /api/images via toBackendImageUrl().
  imageUrl: string
  href: string
}

export interface BannersResponse {
  duo: Banner[]     // exactly 2, side-by-side banners
  slider: Banner[]  // N banners, auto-cycling
}
