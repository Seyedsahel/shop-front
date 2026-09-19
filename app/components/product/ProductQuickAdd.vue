<script setup lang="ts">
const props = defineProps<{ product: Product }>()
const open = defineModel<boolean>({ required: true })
const details = useProductDetailStore()
const cart = useCartStore()
const toast = useAppToast()
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const selectedVariantId = ref<string | null>(null)
const quantity = ref(1)
let requestId = 0
const detail = computed(() => details.bySlug[props.product.slug])
const selectedVariant = computed(() => detail.value?.purchaseVariants.find(variant => variant.variantId === selectedVariantId.value))
const stock = computed(() => selectedVariant.value?.stock ?? (detail.value?.purchaseVariants.length ? 0 : detail.value?.baseStock ?? 0))
const unitPrice = computed(() => selectedVariant.value?.finalPrice ?? detail.value?.price.final ?? props.product.price.final)
const ready = computed(() => !loading.value && !error.value && !!detail.value && stock.value > 0)

async function load() {
  const active = ++requestId
  loading.value = true
  error.value = ''
  quantity.value = 1
  try {
    const product = await details.loadBySlug(props.product.slug)
    if (active !== requestId) return
    selectedVariantId.value = product.purchaseVariants.find(variant => variant.stock > 0)?.variantId ?? null
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
watch(stock, value => { quantity.value = Math.min(quantity.value, Math.max(value, 1)) })

async function add() {
  if (!ready.value || submitting.value || cart.busy || cart.stale) return
  submitting.value = true
  try {
    await cart.addItem(props.product.id, quantity.value, selectedVariantId.value)
    toast.success('محصول به سبد خرید اضافه شد.')
    open.value = false
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : 'افزودن به سبد ناموفق بود.'
  } finally {
    submitting.value = false
  }
}
async function retry() {
  if (cart.stale) {
    try { await cart.fetchCart(); error.value = '' } catch { error.value = cart.error }
  } else await load()
}
</script>

<template>
  <UiModal v-model="open" title="افزودن به سبد خرید" :dismissible="!submitting">
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
      <fieldset v-if="detail.purchaseVariants.length" :disabled="submitting" class="mb-5 space-y-2">
        <legend class="mb-2 text-sm font-semibold">انتخاب {{ detail.purchaseVariants[0]?.name }}</legend>
        <label v-for="variant in detail.purchaseVariants" :key="variant.variantId" class="flex cursor-pointer items-center gap-3 rounded-xl border p-3" :class="[selectedVariantId === variant.variantId ? 'border-primary bg-primary-subtle' : 'border-border', variant.stock <= 0 ? 'opacity-50' : '']">
          <input v-model="selectedVariantId" type="radio" :name="`quick-variant-${product.id}`" :value="variant.variantId" :disabled="variant.stock <= 0" class="accent-primary" />
          <span class="flex-1 text-sm">{{ variant.value }}<span v-if="variant.stock <= 0" class="ms-2 text-danger">ناموجود</span></span>
          <span class="text-sm">{{ formatMoney(variant.finalPrice) }}</span>
        </label>
      </fieldset>
      <div class="mb-5 flex items-center justify-between gap-3">
        <span class="text-sm">تعداد <span class="text-xs text-text-muted">({{ stock.toLocaleString('fa-IR') }} عدد موجود)</span></span>
        <div class="flex items-center gap-4 rounded-xl bg-surface p-1">
          <button type="button" aria-label="کاهش تعداد" class="size-10 rounded-lg bg-card disabled:opacity-40" :disabled="quantity <= 1 || submitting" @click="quantity--">−</button>
          <output class="min-w-5 text-center">{{ quantity.toLocaleString('fa-IR') }}</output>
          <button type="button" aria-label="افزایش تعداد" class="size-10 rounded-lg bg-card disabled:opacity-40" :disabled="quantity >= stock || submitting" @click="quantity++">+</button>
        </div>
      </div>
      <button type="button" class="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50" :disabled="!ready || submitting || cart.busy || cart.stale" @click="add">
        {{ submitting ? 'در حال افزودن…' : stock <= 0 ? 'ناموجود' : `افزودن به سبد · ${formatMoney(unitPrice * quantity)}` }}
      </button>
    </template>
  </UiModal>
</template>
