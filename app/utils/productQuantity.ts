/** Zero is unlimited. Product caps apply across all variants; stock is per variant. */
export function productQuantityLimits(input: {
  stock: number
  productMaxPerOrder: number
  variantMaxPerOrder?: number
  productQuantity: number
  variantQuantity: number
}) {
  const remaining = (cap: number | undefined, used: number) => cap && cap > 0 ? Math.max(0, cap - used) : Infinity
  const orderRemaining = Math.min(
    remaining(input.productMaxPerOrder, input.productQuantity),
    remaining(input.variantMaxPerOrder, input.variantQuantity),
  )
  return {
    orderRemaining,
    maxAdditional: Math.max(0, Math.min(input.stock - input.variantQuantity, orderRemaining)),
  }
}

/** PATCH sets the line total, unlike POST which adds to the existing quantity. */
export function cartLineQuantityLimits(item: CartItem, items: CartItem[], productMaxPerOrder = 0) {
  const otherQuantity = items.filter(line => line.product_id === item.product_id && line.id !== item.id)
    .reduce((total, line) => total + line.quantity, 0)
  const orderMaximum = Math.min(
    item.max_per_order > 0 ? item.max_per_order : Infinity,
    productMaxPerOrder > 0 ? Math.max(0, productMaxPerOrder - otherQuantity) : Infinity,
  )
  return { orderMaximum, maxQuantity: Math.max(0, Math.min(item.stock, orderMaximum)) }
}
