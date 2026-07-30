<script setup lang="ts">
const bannerStore = useBannerStore()
onMounted(() => bannerStore.fetchBanners())
</script>

<template>
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="flex flex-col sm:flex-row gap-4">
      <template v-if="bannerStore.isLoading">
        <div v-for="n in 2" :key="n" class="flex-1 bg-loading aspect-16/10 sm:aspect-4/2 rounded-2xl bg-surface-hover animate-pulse" />
      </template>

      <a
        v-else
        v-for="banner in bannerStore.duo"
        :key="banner.id"
        :href="banner.href"
        class="relative flex-1 min-h-40 aspect-16/10 sm:aspect-4/2 rounded-2xl overflow-hidden group"
      >
        <img :src="banner.imageUrl" alt="" class="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div class="absolute inset-0 bg-linear-to-t from-charcoal/50 to-transparent" />
        <span class="absolute bottom-4 inset-s-4 bg-secondary hover:bg-secondary/90 text-text-on-dark text-sm font-medium px-5 py-2 rounded-xl">
          مشاهده و خرید
        </span>
      </a>
    </div>
  </section>
</template>