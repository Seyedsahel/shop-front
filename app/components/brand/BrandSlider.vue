<script setup lang="ts">
const brandStore = useBrandStore()
const brandsWithImages = computed(() => brandStore.homeItems.filter(brand => brand.imageUrl?.trim()))
</script>

<template>
  <UiOptionalSection :failed="!!brandStore.homeError">
  <UiSlider v-bind="$attrs" v-if="brandsWithImages.length || brandStore.homeLoading" title="محبوب‌ترین برندها" :is-loading="brandStore.homeLoading" :skeleton-count="8" :item-width-px="112">
        
    <NuxtLink
            v-for="brand in brandsWithImages"
            :key="brand.id"
            :to="`/products?brand=${brand.slug}`"
            class="w-22 sm:w-32 shrink-0 snap-start flex flex-col items-center justify-center gap-1 rounded-xl border border-border-strong bg-surface hover:border-accent transition-colors"
        >
            <img :src="brand.imageUrl" :alt="brand.name" class="p-1 rounded-full overflow-hidden" />
            <span class="text-md font-bold text-center text-primary">{{ brand.name }}</span>
        </NuxtLink>
  </UiSlider>
  </UiOptionalSection>
</template>
