export type ApiErrorContext = 'default' | 'auth' | 'cartMutation' | 'checkout' | 'productDetail'

type ApiErrorKind = 'http' | 'network' | 'timeout' | 'cancelled'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly source: 'local' | 'transport' = 'local',
    public readonly kind: ApiErrorKind = 'http',
    public readonly validationMessage?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function messageForStatus(status: number | undefined, context: ApiErrorContext, kind: ApiErrorKind) {
  if (kind === 'cancelled') return 'درخواست لغو شد.'
  if (kind === 'timeout') return 'پاسخی از سرور دریافت نشد. لطفاً کمی بعد دوباره تلاش کنید.'
  if (kind === 'network' || !status) return 'اتصال به سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.'

  if (status === 400) return 'درخواست شما نامعتبر است. لطفاً اطلاعات واردشده را بررسی کنید.'
  if (status === 401) return context === 'auth'
    ? 'نشست شما منقضی شده است. لطفاً دوباره وارد حساب کاربری شوید.'
    : 'برای انجام این عملیات باید وارد حساب کاربری شوید.'
  if (status === 403) return 'شما اجازه انجام این عملیات را ندارید.'
  if (status === 404) return context === 'productDetail'
    ? 'محصول موردنظر پیدا نشد.'
    : 'اطلاعات موردنظر پیدا نشد.'
  if (status === 409) return context === 'cartMutation'
    ? 'تغییر سبد خرید با وضعیت فعلی کالا امکان‌پذیر نیست. لطفاً سبد خرید را دوباره بررسی کنید.'
    : context === 'checkout'
      ? 'ثبت سفارش با وضعیت فعلی امکان‌پذیر نیست. لطفاً سبد خرید را دوباره بررسی کنید.'
      : 'این عملیات با وضعیت فعلی اطلاعات سازگار نیست. لطفاً دوباره تلاش کنید.'
  if (status === 422) return 'اطلاعات واردشده معتبر نیست. لطفاً دوباره بررسی کنید.'
  if (status === 429) return 'تعداد درخواست‌ها زیاد بوده است. لطفاً کمی بعد دوباره تلاش کنید.'
  if (status === 502 || status === 503 || status === 504) return 'در حال حاضر سرویس در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.'
  if (status >= 500) return 'در ارتباط با سرور مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.'
  return 'انجام این عملیات ممکن نشد. لطفاً دوباره تلاش کنید.'
}

export function getUserFriendlyApiErrorMessage(error: unknown, context: ApiErrorContext = 'default') {
  if (error instanceof ApiError) {
    if (error.source === 'local') return error.message
    if (error.validationMessage) return error.validationMessage
    return messageForStatus(error.status, context, error.kind)
  }
  return messageForStatus(undefined, context, 'network')
}

export function withApiErrorContext(error: unknown, context: ApiErrorContext): unknown {
  if (!(error instanceof ApiError) || error.source === 'local') return error
  return new ApiError(
    error.validationMessage ?? messageForStatus(error.status, context, error.kind),
    error.status,
    error.code,
    'transport',
    error.kind,
    error.validationMessage,
  )
}

export function createTransportApiError(status?: number, code?: string, kind: ApiErrorKind = 'http', validationMessage?: string) {
  return new ApiError(validationMessage ?? messageForStatus(status, 'default', kind), status, code, 'transport', kind, validationMessage)
}
