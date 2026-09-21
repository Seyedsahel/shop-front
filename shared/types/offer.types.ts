export interface HomepageDiscount {
  id: string
  name: string
  description: string
  type: string
  value: number
  scope: string
  priority: number
  stackable: boolean
  isActive: boolean
  showOnHome: boolean
  startsAt: string | null
  endsAt: string | null
}
