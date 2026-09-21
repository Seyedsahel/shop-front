<script setup lang="ts">
const offerStore = useOfferStore()
onMounted(() => offerStore.fetchOffer())
</script>

<template>
  <section v-if="offerStore.products.length || offerStore.isLoading || offerStore.error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
    <div class="rounded-2xl bg-offer-bg p-5 sm:p-6 flex flex-col sm:flex-row gap-6">

      <div class="flex flex-col items-center justify-center sm:items-start gap-3 sm:w-52 shrink-0 text-center sm:text-start">
        <h2 class="text-lg sm:text-2xl font-bold text-offer-foreground">پیشنهاد شگفت‌انگیز</h2>
        <NuxtLink
          v-if="offerStore.discount"
          class="inline-flex items-center justify-center border border-white/40 text-offer-foreground bg-white/20 hover:bg-white/10 rounded-full px-6 py-2 text-sm font-medium transition-colors"
          :to="{ path: '/products', query: { discount: offerStore.discount.id } }"
        >
          مشاهده همه
        </NuxtLink>
        <UiCountdownTimer :target-date="offerStore.endsAt" />
      </div>

      <div v-if="offerStore.error" class="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl bg-white/10 px-5 py-10 text-center text-offer-foreground">
        <UIcon name="solar:danger-triangle-outline" class="size-8" />
        <p class="text-sm">{{ offerStore.error }}</p>
        <button type="button" class="rounded-full border border-white/40 bg-white/20 px-5 py-2 text-sm font-medium transition-colors hover:bg-white/10" @click="offerStore.fetchOffer(true)">تلاش دوباره</button>
      </div>

      <div v-else class="flex-1 overflow-hidden">
        <UiScrollTrack :is-loading="offerStore.isLoading" :skeleton-count="4" :item-width-px="176">
          <div v-for="product in offerStore.products" :key="product.id" class="w-44 shrink-0 snap-start">
            <ProductCard :product="product" />
          </div>
        </UiScrollTrack>
      </div>

    </div>
  </section>
</template>
