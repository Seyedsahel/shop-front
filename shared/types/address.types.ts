export interface ShippingCity {
  code: number
  title: string
}

export interface ShippingProvince {
  code: number
  title: string
  cities: ShippingCity[]
}

export interface Address {
  id: string
  name: string
  phone_number: string
  user_id: string
  province_code: number
  city_code: number
  postal_code: string
  address: string
}

export interface AddressInput {
  name: string
  phone: string
  province_code: number
  city_code: number
  postal_code: string
  address: string
}
