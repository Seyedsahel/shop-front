export function normalizeAuthDigits(value: string): string {
  return value.replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
}

/** Preserve the existing backend format: ten digits starting with 9. */
export function normalizeAuthPhone(value: string): string {
  return normalizeAuthDigits(value).trim().replace(/[\s()-]/g, '')
    .replace(/^(?:\+98|0098|0)(?=9)/, '')
}

export function authPhoneError(value: string): string {
  if (!value) return 'شماره تماس الزامی است.'
  return /^9\d{9}$/.test(value) ? '' : 'شماره تماس معتبر نیست.'
}

export function otpCodeError(value: string): string {
  return /^\d{4}$/.test(value) ? '' : 'کد تایید ۴ رقمی معتبر وارد کنید.'
}

export function parseOtpRequestInput(value: unknown): RequestOtpPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const body = value as Record<string, unknown>
  if (typeof body.phone !== 'string') return null
  const phone = normalizeAuthPhone(body.phone)
  return authPhoneError(phone) ? null : { phone }
}

export function parseOtpVerifyInput(value: unknown): VerifyOtpPayload | null {
  const request = parseOtpRequestInput(value)
  if (!request) return null
  const body = value as Record<string, unknown>
  if (typeof body.code !== 'string') return null
  const code = normalizeAuthDigits(body.code).trim()
  return otpCodeError(code) ? null : { ...request, code }
}
