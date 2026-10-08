export interface ShopInfo {
  address: string
  phoneNumber: string
  instagramId: string
  telegramId: string
  email: string
  name: string
  description: string
  /** Backend filenames are exposed through the shared /api/images proxy. */
  logoImageUrl: string
  enamadImageUrl: string
}
