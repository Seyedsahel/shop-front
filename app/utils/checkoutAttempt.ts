/** UUID v4 from the platform CSPRNG, including storefronts served over HTTP. */
export function createCheckoutKey(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function checkoutAttemptStorageKey(scope: string): string {
  return `shop-checkout-attempt:${scope}`
}

export function sameCheckoutInput(left: CheckoutInput, right: CheckoutInput): boolean {
  return left.cart_id === right.cart_id && left.address_id === right.address_id
    && (!!left.address === !!right.address)
    && (['address', 'city_code', 'first_name', 'last_name', 'phone', 'postal_code', 'province_code'] as const)
      .every(field => left.address?.[field] === right.address?.[field])
    && left.shipping_method_id === right.shipping_method_id
    && left.coupon_code === right.coupon_code && left.torob_clid === right.torob_clid
}

export function isRecoverableCheckoutInput(input: CheckoutInput): boolean {
  if (!input || [input.cart_id, input.shipping_method_id].some(id => typeof id !== 'string' || !id.trim())) return false
  if (input.address_id !== undefined) return typeof input.address_id === 'string' && !!input.address_id.trim() && input.address === undefined
  const address = input.address
  if (!address || typeof address !== 'object' || Array.isArray(address) || !Object.keys(address).length) return false
  return (['address', 'first_name', 'last_name', 'phone', 'postal_code'] as const)
    .every(field => address[field] === undefined || typeof address[field] === 'string')
    && (['city_code', 'province_code'] as const)
      .every(field => address[field] === undefined || Number.isSafeInteger(address[field]) && address[field]! >= 0)
}
