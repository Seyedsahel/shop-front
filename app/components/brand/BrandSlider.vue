<script setup lang="ts">
const brandStore = useBrandStore()
onMounted(() => brandStore.fetchBrands())
</script>

<template>
  <UiSlider title="محبوب‌ترین برندها" :is-loading="brandStore.isLoading" :skeleton-count="8" :item-width-px="112">
        
    <NuxtLink
            v-for="brand in brandStore.items"
            :key="brand.id"
            :to="brand.href ?? '#'"
            class="w-22 sm:w-32 shrink-0 snap-start flex flex-col items-center justify-center gap-1 rounded-xl border border-border-strong bg-surface hover:border-accent transition-colors"
        >
            <img :src="brand.logoUrl" :alt="brand.name" class="p-1 overflow-hidden" />
        </NuxtLink>
  </UiSlider>
</template>
