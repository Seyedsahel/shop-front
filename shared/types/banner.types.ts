export interface Banner {
  id: string
  title: string
  // Backend images are exposed through /api/images via toBackendImageUrl().
  imageUrl: string
  href?: string
  sortOrder: number
}

export interface BannersResponse {
  homeHero: Banner[]   // six images for the home hero collage
  homeTop: Banner[]    // N banners, auto-cycling
  homeMiddle: Banner[] // two side-by-side banners
}
