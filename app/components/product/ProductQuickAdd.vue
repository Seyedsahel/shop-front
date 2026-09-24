<script setup lang="ts">
const props = defineProps<{ product: Product }>()
const open = defineModel<boolean>({ required: true })
const details = useProductDetailStore()
const cart = useCartStore()
const toast = useAppToast()
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const quantity = ref(1)
let requestId = 0
const detail = computed(() => details.bySlug[props.product.slug])
const cartLines = computed(() => cart.itemsForProduct(props.product.id))
const { attributes, selectedOptions, selectedVariant, select, reset } = useProductVariants(() => detail.value?.purchaseVariants ?? [])
const stock = computed(() => detail.value?.purchaseVariants.length
  ? selectedVariant.value?.stock ?? null
  : detail.value?.baseStock ?? null)
const unitPrice = computed(() => selectedVariant.value?.finalPrice ?? detail.value?.price.final ?? props.product.price.final)
const ready = computed(() => !loading.value && !error.value && !!detail.value && stock.value !== null && stock.value > 0)

async function load() {
  const active = ++requestId
  loading.value = true
  error.value = ''
  quantity.value = 1
  try {
    const product = await details.loadBySlug(props.product.slug)
    if (active !== requestId) return
    reset()
  } catch (caught) {
    if (active === requestId) error.value = caught instanceof ApiError ? caught.message : 'دریافت اطلاعات محصول ناموفق بود.'
  } finally {
    if (active === requestId) loading.value = false
  }
}
watch(() => [open.value, props.product.slug] as const, ([visible]) => {
  if (visible) void load()
  else requestId++
}, { immediate: true })
watch(() => selectedVariant.value?.variantId, () => { quantity.value = 1 })

async function add() {
  if (!ready.value || submitting.value || cart.busy || cart.stale) return
  if (detail.value?.purchaseVariants.length && !selectedVariant.value) return
  submitting.value = true
  try {
    await cart.addItem(props.product.id, quantity.value, selectedVariant.value?.variantId ?? null)
    toast.success('محصول به سبد خرید اضافه شد.')
    open.value = false
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : 'افزودن به سبد ناموفق بود.'
  } finally {
    submitting.value = false
  }
}
async function changeCartLineQuantity(item: CartItem, amount: number) {
  if (cart.busy || cart.stale) return
  try {
    if (amount < 0 && item.quantity === 1) {
      if (!(await useConfirm('این کالا از سبد حذف شود؟'))) return
      await cart.remove(item.id)
      toast.success('کالا از سبد حذف شد.')
      return
    }
    await cart.updateQuantity(item.id, item.quantity + amount)
    toast.success('تعداد کالا به‌روزرسانی شد.')
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : 'به‌روزرسانی سبد ناموفق بود.'
  }
}
async function retry() {
  if (cart.stale) {
    try { await cart.fetchCart(); error.value = '' } catch { error.value = cart.error }
  } else await load()
}
</script>

<template>
  <UiModal v-model="open" :title="cartLines.length ? 'مدیریت گزینه‌های سبد خرید' : 'افزودن به سبد خرید'" :dismissible="!submitting">
    <div class="mb-5 flex items-center gap-4">
      <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="size-20 rounded-xl object-contain bg-surface" />
      <div class="min-w-0"><h3 class="text-sm font-semibold leading-7">{{ product.name }}</h3><p class="mt-2 font-bold text-primary">{{ formatMoney(unitPrice) }}</p></div>
    </div>
    <p v-if="loading" role="status" class="py-8 text-center text-text-secondary">در حال دریافت گزینه‌های خرید…</p>
    <div v-if="error || cart.stale" role="alert" class="mb-4 rounded-xl bg-danger-subtle p-3 text-sm text-danger">
      {{ error || cart.error }}
      <button type="button" class="mt-2 block underline" :disabled="loading || cart.busy" @click="retry">دریافت دوباره</button>
    </div>
    <template v-if="!loading && detail">
      <section v-if="cartLines.length" class="mb-5 space-y-2 border-b border-divider pb-5">
        <h4 class="text-sm font-semibold">گزینه‌های موجود در سبد</h4>
        <div v-for="item in cartLines" :key="item.id" class="flex items-center justify-between gap-3 rounded-xl bg-surface p-3">
          <div class="min-w-0">
            <!-- TODO: Use the variant label supplied by the Cart API once the backend adds it. -->
            <p class="text-sm font-medium">{{ item.variant_id || 'گزینه پیش‌فرض' }}</p>
            <p class="mt-1 text-xs text-text-muted">{{ formatMoney(item.pricing.final_unit) }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-3 rounded-lg bg-card p-1">
            <button type="button" aria-label="کاهش تعداد" class="size-9 rounded-md disabled:opacity-40" :disabled="cart.busy || cart.stale" @click="changeCartLineQuantity(item, -1)">−</button>
            <output class="min-w-5 text-center text-sm font-semibold">{{ item.quantity.toLocaleString('fa-IR') }}</output>
            <button type="button" aria-label="افزایش تعداد" class="size-9 rounded-md disabled:opacity-40" :disabled="cart.busy || cart.stale || item.quantity >= item.stock" @click="changeCartLineQuantity(item, 1)">+</button>
          </div>
        </div>
      </section>
      <ProductVariantSelectors
        v-if="detail.purchaseVariants.length"
        class="mb-5"
        :attributes="attributes"
        :selected-options="selectedOptions"
        :disabled="submitting"
        @select="select"
      />
      <div class="mb-5 flex items-center justify-between gap-3">
        <span class="text-sm">تعداد <span v-if="stock !== null" class="text-xs text-text-muted">({{ stock.toLocaleString('fa-IR') }} عدد موجود)</span></span>
        <div class="flex items-center gap-4 rounded-xl bg-surface p-1">
          <button type="button" aria-label="کاهش تعداد" class="size-10 rounded-lg bg-card disabled:opacity-40" :disabled="quantity <= 1 || submitting" @click="quantity--">−</button>
          <output class="min-w-5 text-center">{{ quantity.toLocaleString('fa-IR') }}</output>
          <button type="button" aria-label="افزایش تعداد" class="size-10 rounded-lg bg-card disabled:opacity-40" :disabled="stock === null || quantity >= stock || submitting" @click="quantity++">+</button>
        </div>
      </div>
      <button type="button" class="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50" :disabled="!ready || submitting || cart.busy || cart.stale" @click="add">
        {{ submitting ? 'در حال افزودن…' : stock === null ? 'گزینه محصول را انتخاب کنید' : stock <= 0 ? 'ناموجود' : `افزودن به سبد · ${formatMoney(unitPrice * quantity)}` }}
      </button>
    </template>
  </UiModal>
</template>
