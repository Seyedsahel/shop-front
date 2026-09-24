export function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_payment: 'در انتظار پرداخت',
    paid: 'پرداخت‌شده',
    processing: 'در حال پردازش',
    shipped: 'ارسال‌شده',
    delivered: 'تحویل‌داده‌شده',
    cancelled: 'لغوشده',
    refunded: 'بازپرداخت‌شده',
  }
  return labels[status] ?? status.replaceAll('_', ' ')
}

export function orderDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
