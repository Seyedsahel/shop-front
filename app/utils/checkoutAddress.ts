export function normalizeCheckoutAddress(draft: AddressInput): AddressInput {
  const digits = (value: string) => value.replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
  return {
    ...draft,
    name: draft.name.trim(), first_name: draft.first_name.trim(), last_name: draft.last_name.trim(),
    phone: digits(draft.phone.trim()).replace(/^(?:\+98|0098)/, '0'),
    postal_code: digits(draft.postal_code.trim()), address: draft.address.trim(),
  }
}

export function checkoutAddressErrors(input: AddressInput, requirements: ShippingAddressRequirements, provinces: ShippingProvince[]) {
  const errors: Partial<Record<keyof AddressInput, string>> = {}
  if ((requirements.first_name || requirements.recipient_name) && !input.first_name) errors.first_name = 'نام تحویل‌گیرنده را وارد کنید.'
  if ((requirements.last_name || requirements.recipient_name) && !input.last_name) errors.last_name = 'نام خانوادگی تحویل‌گیرنده را وارد کنید.'
  if (requirements.phone && !/^09\d{9}$/.test(input.phone)) errors.phone = 'شماره موبایل معتبر وارد کنید.'
  const province = provinces.find(item => item.code === input.province_code)
  if (requirements.province_code && !province) errors.province_code = 'استان را انتخاب کنید.'
  if (requirements.city_code && !provinces.some(item => item.cities.some(city => city.code === input.city_code)
    && (!requirements.province_code || item.code === input.province_code))) errors.city_code = 'شهر را انتخاب کنید.'
  if (requirements.address && !input.address) errors.address = 'نشانی دقیق را وارد کنید.'
  if (requirements.postal_code && !/^\d{10}$/.test(input.postal_code)) errors.postal_code = 'کد پستی باید ۱۰ رقم باشد.'
  return errors
}

export function checkoutAddressPayload(input: AddressInput, name: string): AddressWriteInput {
  const payload: AddressWriteInput = { name }
  for (const field of ['first_name', 'last_name', 'phone', 'postal_code', 'address'] as const) {
    if (input[field]) payload[field] = input[field]
  }
  for (const field of ['province_code', 'city_code'] as const) {
    if (input[field] > 0) payload[field] = input[field]
  }
  return payload
}

export function checkoutInlineAddressPayload(input: AddressInput, pickup: boolean): CheckoutInlineAddress {
  if (pickup) return { first_name: input.first_name, last_name: input.last_name, phone: input.phone }
  const { name: _name, ...address } = checkoutAddressPayload(input, '')
  return address
}
