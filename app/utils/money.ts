export type MoneyUnit = 'rial' | 'toman'
export const displayMoneyUnit: MoneyUnit = 'toman'

/** Inputs and canonical state are always in backend rials. */
export function convertRials(value: number, unit: MoneyUnit = displayMoneyUnit): number {
  return unit === 'toman' ? value / 10 : value
}
export function formatMoney(value: number, unit: MoneyUnit = displayMoneyUnit): string {
  return `${convertRials(value, unit).toLocaleString('fa-IR', { maximumFractionDigits: 2 })} ${unit === 'toman' ? 'تومان' : 'ریال'}`
}
