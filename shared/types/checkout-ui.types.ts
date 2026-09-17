/**
 * UI-only shapes for the temporary checkout experience.
 * TODO: Replace with Cart API and Address API contracts when those are available.
 */
export interface CartUiItem {
  id: string
  productId: string
  slug: string
  name: string
  imageUrl: string
  description: string
  unitPrice: number
  originalPrice?: number
  quantity: number
  stock: number
}

export interface AddressDraft {
  id: string
  label: string
  recipientName: string
  phone: string
  province: string
  city: string
  address: string
  plaque: string
  unit: string
  postalCode: string
  deliveryNote: string
}

export type DeliveryMethod = 'courier' | 'pickup' | 'post'
