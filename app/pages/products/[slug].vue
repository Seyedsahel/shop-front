<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const productDetailStore = useProductDetailStore()
const detailOwner = productDetailStore.claimDetailOwner()
const detailPath = route.path
const removeNavigationHook = router.afterEach((to, _from, failure) => {
  if (!failure && to.path !== detailPath) productDetailStore.invalidateDetail(detailOwner)
})
onBeforeUnmount(() => { removeNavigationHook(); productDetailStore.invalidateDetail(detailOwner) })
const slug = computed(() => typeof route.params.slug === 'string' ? route.params.slug : '')

const setStatus = usePageResponse()
const product = computed(() => productDetailStore.current?.slug === slug.value ? productDetailStore.current : null)
async function loadProduct() {
  const requestedSlug = slug.value
  await productDetailStore.fetchBySlug(requestedSlug, detailOwner)
  if (String(router.currentRoute.value.params.slug) !== requestedSlug) return
  if (productDetailStore.errorStatus === 404) {
    const missing = createError({ statusCode: 404, statusMessage: 'Product not found' })
    if (import.meta.server) throw missing
    showError(missing)
  } else if (productDetailStore.error) setStatus(productDetailStore.errorStatus ?? 503)
}
watch(slug, () => { void loadProduct() })
usePageSeo(() => product.value?.name ?? 'محصول', () => product.value?.description ?? '')
await callOnce(`product:${slug.value}`, loadProduct, { mode: 'navigation' })
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
    <template v-if="productDetailStore.isLoading">
      <div class="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div class="aspect-square animate-pulse rounded-2xl bg-loading" />
        <div class="space-y-5"><div class="h-5 w-24 animate-pulse rounded bg-loading" /><div class="h-12 w-3/4 animate-pulse rounded bg-loading" /><div class="h-20 animate-pulse rounded-2xl bg-loading" /><div class="h-28 animate-pulse rounded-2xl bg-loading" /></div>
      </div>
      <div class="mt-10 h-60 animate-pulse rounded-2xl bg-loading" />
    </template>

    <div v-else-if="productDetailStore.error" class="mx-auto max-w-xl rounded-2xl border border-danger-border bg-card p-8 text-center">
      <UIcon name="solar:danger-triangle-outline" class="mx-auto size-10 text-danger" />
      <h1 class="mt-4 text-lg font-semibold text-text-primary">دریافت محصول ممکن نشد</h1>
      <p class="mt-2 text-sm text-text-secondary">{{ productDetailStore.error }}</p>
      <button type="button" class="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover" @click="loadProduct">تلاش دوباره</button>
    </div>

    <div v-else-if="product" class="space-y-10">
      <nav class="flex flex-wrap items-center gap-2 text-xs text-text-muted" aria-label="مسیر صفحه">
        <NuxtLink to="/" class="hover:text-primary">خانه</NuxtLink>
        <UIcon name="solar:alt-arrow-left-linear" class="size-3" />
        <NuxtLink to="/products" class="hover:text-primary">محصولات</NuxtLink>
        <template v-for="category in product.categories" :key="category.id">
          <UIcon name="solar:alt-arrow-left-linear" class="size-3" />
          <NuxtLink :to="`/products?category=${category.slug}`" class="min-w-0 max-w-full wrap-anywhere hover:text-primary">{{ category.name }}</NuxtLink>
        </template>
        <UIcon name="solar:alt-arrow-left-linear" class="size-3" />
        <span class="min-w-0 max-w-full flex-1 truncate text-text-secondary" aria-current="page" :title="product.name" dir="auto">{{ product.name }}</span>
      </nav>

      <section class="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductDetailGallery :product="product" class="min-w-0" />
        <ProductPurchasePanel :product="product" />
      </section>

      <section class="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <ProductDetailTabs :product="product" />
        <ProductSpecifications :specifications="product.specifications" />
      </section>

      <ProductRelatedProducts :category-id="product.categories[0]?.id" :current-product-id="product.id" />
    </div>

    <div v-else class="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
      <h1 class="text-lg font-semibold text-text-primary">محصول پیدا نشد</h1>
      <NuxtLink to="/products" class="mt-5 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover">بازگشت به محصولات</NuxtLink>
    </div>
  </div>
</template>
