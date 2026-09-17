const initialItems: CartUiItem[] = [
  { id: 'cart-1', productId: 'rose-serum', slug: 'rose-serum', name: 'سرم ویتامین سی وایت ویت ویتالایر', imageUrl: 'https://dkstatics-public.digikala.com/digikala-products/c64720f4446aa94b873dab4ae35091bc3f0fcc22_1637680139.jpg?x-oss-process=image/resize,m_lfit,h_600,w_600/quality,q_80/format,webp', description: 'حجم ۳۰ میلی‌لیتر · روشن‌کننده و محرک کلاژن‌سازی', unitPrice: 480000, originalPrice: 600000, quantity: 1, stock: 5 },
  { id: 'cart-2', productId: 'cashmere-cream', slug: 'cashmere-cream', name: 'کرم مرطوب‌کننده و ترمیم‌کننده کشمیری', imageUrl: 'https://dkstatics-public.digikala.com/digikala-products/c64720f4446aa94b873dab4ae35091bc3f0fcc22_1637680139.jpg?x-oss-process=image/resize,m_lfit,h_600,w_600/quality,q_80/format,webp', description: 'مناسب پوست خشک و حساس · بافت سبک و جذب سریع', unitPrice: 320000, quantity: 2, stock: 8 },
  { id: 'cart-3', productId: 'amber-oil', slug: 'amber-oil', name: 'روغن مراقبت پوست با عصاره‌های گیاهی', imageUrl: 'https://dkstatics-public.digikala.com/digikala-products/c64720f4446aa94b873dab4ae35091bc3f0fcc22_1637680139.jpg?x-oss-process=image/resize,m_lfit,h_600,w_600/quality,q_80/format,webp', description: '۳۰ میلی‌لیتر · تغذیه‌کننده و نرم‌کننده پوست', unitPrice: 275000, originalPrice: 340000, quantity: 1, stock: 3 },
]

export const useCartStore = defineStore('cart', () => {
  // TODO: Replace this temporary UI state with Cart API-backed canonical state.
  const items = ref<CartUiItem[]>(initialItems.map(item => ({ ...item })))
  // TODO: Replace with Favorites API-backed canonical state.
  const wishlistProductIds = ref<string[]>([])
  const isAdding = ref(false)
  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const subtotal = computed(() => items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))
  const discount = computed(() => items.value.reduce((sum, item) => sum + ((item.originalPrice ?? item.unitPrice) - item.unitPrice) * item.quantity, 0))

  function fetchCart() {
    // TODO: Replace with Cart API fetch. The mock is initialized above for UI development.
  }

  function addItem(productId: string, quantity = 1, product?: Product) {
    isAdding.value = true
    const existing = items.value.find(item => item.productId === productId)
    if (existing) existing.quantity = Math.min(existing.quantity + quantity, existing.stock)
    else items.value.push({
      id: `cart-${productId}`,
      productId,
      slug: product?.slug ?? productId,
      name: product?.name ?? 'محصول انتخاب‌شده',
      imageUrl: product?.imageUrl ?? '',
      description: product?.description ?? 'جزئیات محصول پس از اتصال به API نمایش داده می‌شود.',
      unitPrice: product?.price.final ?? product?.basePrice ?? 0,
      originalPrice: product?.price.original,
      quantity,
      stock: product?.stock ?? quantity,
    })
    useAppToast().success('محصول به سبد خرید اضافه شد.')
    isAdding.value = false
  }

  function increase(id: string) { const item = items.value.find(entry => entry.id === id); if (item && item.quantity < item.stock) item.quantity++ }
  function decrease(id: string) { const item = items.value.find(entry => entry.id === id); if (!item) return; if (item.quantity === 1) remove(id); else item.quantity-- }
  function remove(id: string) { items.value = items.value.filter(item => item.id !== id) }
  function clear() { items.value = [] }
  function moveToWishlist(id: string) {
    const item = items.value.find(entry => entry.id === id)
    if (!item) return
    if (!wishlistProductIds.value.includes(item.productId)) wishlistProductIds.value.push(item.productId)
    remove(id)
    useAppToast().success('محصول به علاقه‌مندی‌ها منتقل شد.')
  }

  return { items, itemCount, subtotal, discount, wishlistProductIds, isAdding, fetchCart, addItem, increase, decrease, remove, clear, moveToWishlist }
})
