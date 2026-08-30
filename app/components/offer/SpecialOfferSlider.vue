<script setup lang="ts">
const offerStore = useOfferStore()
onMounted(() => offerStore.fetchOffer())
</script>

<template>
  <section v-if="offerStore.products.length || offerStore.isLoading" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
    <div class="rounded-2xl bg-offer-bg p-5 sm:p-6 flex flex-col sm:flex-row gap-6">

      <div class="flex flex-col items-center justify-center sm:items-start gap-3 sm:w-52 shrink-0 text-center sm:text-start">
        <h2 class="text-lg sm:text-2xl font-bold text-offer-foreground">پیشنهاد شگفت‌انگیز</h2>
        <UButton to="products?category=offer" variant="outline" 
          class="border-white/40 text-offer-foreground bg-white/20 hover:bg-white/10 rounded-full px-6">
          مشاهده همه
        </UButton>
        <UiCountdownTimer :target-date="offerStore.endsAt" />
      </div>

      <div class="flex-1 overflow-hidden">
        <UiScrollTrack :is-loading="offerStore.isLoading" :skeleton-count="4" :item-width-px="176">
          <div v-for="product in offerStore.products" :key="product.id" class="w-44 shrink-0 snap-start">
            <ProductCard :product="product" />
          </div>
        </UiScrollTrack>
      </div>

    </div>
  </section>
</template>