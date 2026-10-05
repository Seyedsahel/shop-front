export interface PaymentMethod {
  id: string
  code: string
  name: string
  provider: string
}

export interface PaymentRedirect {
  payment_id: string
  redirect_url: string
}
