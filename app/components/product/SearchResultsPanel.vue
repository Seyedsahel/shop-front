<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const props = withDefaults(defineProps<{
  query: string
  mode?: 'desktop' | 'mobile'
  limit?: number
}>(), {
  mode: 'desktop',
  limit: 12,
})

const emit = defineEmits<{
  close: []
}>()

const productListStore = useProductListStore()
const normalizedQuery = computed(() => props.query.trim())

const runSearch = useDebounceFn((query: string) => {
  if (!query) {
    productListStore.clearSearch()
    return
  }

  productListStore.searchProducts({
    search: query,
    page: 1,
    limit: props.limit,
    sortBy: 'base_price',
    sortDir: 'desc',
  })
}, 300)

watch(normalizedQuery, query => {
  runSearch(query)
}, { immediate: true })

onBeforeUnmount(() => {
  if (!normalizedQuery.value) productListStore.clearSearch()
})

const hasQuery = computed(() => normalizedQuery.value.length > 0)
const products = computed(() => productListStore.searchItems)
const isLoading = computed(() => productListStore.isSearchLoading)
const error = computed(() => productListStore.searchError)
const total = computed(() => productListStore.searchTotal)
const searchRoute = computed(() => ({ path: '/products', query: { search: normalizedQuery.value } }))

function productPrice(product: Product) {
  return product.price?.final ?? product.basePrice
}

function close() {
  emit('close')
}
</script>

<template>
  <section
    class="overflow-hidden border border-border bg-card shadow-2xl"
    :class="mode === 'desktop'
      ? 'rounded-2xl'
      : 'flex min-h-0 flex-1 flex-col border-0 shadow-none'"
  >
    <div
      class="border-b border-divider bg-card px-4 py-3"
      :class="mode === 'desktop' ? 'hidden md:flex items-center gap-3' : 'hidden'"
    >
      <button
        type="button"
        class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-text-primary text-card transition-colors hover:bg-text-secondary"
        @click="runSearch(normalizedQuery)"
      >
        <UIcon name="solar:magnifer-linear" class="size-5" />
      </button>
      <span class="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
        {{ normalizedQuery || 'جستجوی محصولات' }}
      </span>
      <button
        type="button"
        class="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
        @click="close"
      >
        <UIcon name="solar:close-circle-broken" class="size-5" />
      </button>
    </div>

    <div class="flex items-center justify-between gap-2 border-b border-divider bg-surface/55 px-5 py-2.5 text-xs text-text-secondary">
      <span v-if="hasQuery">
        یافت‌شده:
        <span class="font-bold text-text-primary">{{ total.toLocaleString('fa-IR') }} کالا</span>
      </span>
      <span v-else>عبارت مورد نظر را وارد کنید.</span>
      <span v-if="isLoading" class="text-text-muted">در حال جستجو...</span>
    </div>

    <div
      class="min-h-0 overflow-y-auto bg-card"
      :class="mode === 'desktop'
        ? 'grid max-h-[58vh] grid-cols-1 divide-y divide-divider md:grid-cols-2 md:[&>*:nth-child(odd)]:border-l md:[&>*:nth-child(odd)]:border-divider lg:grid-cols-3 lg:divide-y-0 lg:[&>*:not(:nth-child(3n))]:border-l'
        : 'flex-1 divide-y divide-divider'"
    >
      <template v-if="isLoading && !products.length">
        <div v-for="n in 6" :key="n" class="flex items-center justify-between gap-3 p-4">
          <div class="flex-1 space-y-3">
            <div class="h-4 w-4/5 rounded bg-loading animate-pulse" />
            <div class="h-3 w-1/3 rounded bg-loading animate-pulse" />
          </div>
          <div class="h-20 w-16 rounded-lg bg-loading animate-pulse" />
        </div>
      </template>

      <div v-else-if="error" class="col-span-full flex min-h-48 items-center justify-center px-6 text-center text-sm text-danger">
        {{ error }}
      </div>

      <div v-else-if="hasQuery && !products.length" class="col-span-full flex min-h-48 items-center justify-center px-6 text-center text-sm text-text-muted">
        نتیجه‌ای برای این جستجو پیدا نشد.
      </div>

      <div v-else-if="!hasQuery" class="col-span-full flex min-h-48 items-center justify-center px-6 text-center text-sm text-text-muted">
        نام محصول یا برند را جستجو کنید.
      </div>

      <NuxtLink
        v-else
        v-for="product in products"
        :key="product.id"
        :to="`/products/${product.slug}`"
        class="group flex items-center justify-between gap-3 p-4 text-right transition-colors hover:bg-surface/70"
        @click="close"
      >
        <div class="min-w-0 flex-1">
          <h4 class="line-clamp-2 text-xs font-semibold leading-6 text-text-primary transition-colors group-hover:text-accent-foreground sm:text-sm">
            {{ product.name }}
          </h4>
          <div class="mt-2 text-sm font-bold text-text-primary">
            {{ formatMoney(productPrice(product)) }}
          </div>
          <div v-if="product.price.discountPercent > 0" class="mt-1 text-[11px] text-danger">
            {{ product.price.discountPercent.toLocaleString('fa-IR') }}٪ تخفیف
          </div>
        </div>
        <div class="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface p-1">
          <img
            v-if="product.imageUrl"
            :src="product.imageUrl"
            :alt="product.name"
            class="max-h-full object-contain"
          />
          <UIcon v-else name="solar:box-minimalistic-broken" class="size-7 text-text-muted" />
        </div>
      </NuxtLink>
    </div>

    <div v-if="hasQuery" class="border-t border-divider bg-surface/55 p-3 text-center">
      <NuxtLink
        :to="searchRoute"
        class="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-bold text-text-primary transition-colors hover:bg-border"
        @click="close"
      >
        <span>مشاهده همه نتایج</span>
        <UIcon name="solar:arrow-left-linear" class="size-4" />
      </NuxtLink>
    </div>
  </section>
</template>
