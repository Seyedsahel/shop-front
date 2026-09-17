<script setup lang="ts">
const brandStore = useBrandStore()
onMounted(() => brandStore.fetchBrands())
</script>

<template>
  <UiSlider v-if="brandStore.items.length || brandStore.isLoading" title="محبوب‌ترین برندها" :is-loading="brandStore.isLoading" :skeleton-count="8" :item-width-px="112">
        
    <NuxtLink
            v-for="brand in brandStore.items"
            :key="brand.id"
            :to="`/products?brand=${brand.slug}`"
            class="w-22 sm:w-32 shrink-0 snap-start flex flex-col items-center justify-center gap-1 rounded-xl border border-border-strong bg-surface hover:border-accent transition-colors"
        >
            <img :src="brand.imageUrl" :alt="brand.name" class="p-1 rounded-full overflow-hidden" />
            <span class="text-md font-bold text-center text-primary">{{ brand.name }}</span>
        </NuxtLink>
  </UiSlider>
</template>
