<script setup lang="ts">
const props = defineProps<{ category: string; title?: string }>()
const productStore = useProductStore()

onMounted(() => {
  productStore.fetchByCategory(props.category)
})

const products = computed(() => productStore.byCategory[props.category] ?? [])
</script>

<template>
  <section class="max-w-full mx-auto px-6 sm:px-8 lg:px-16 py-10">
    <div class="flex justify-center items-center mb-7">
      <h2 v-if="title" class="text-lg sm:text-2xl font-semibold text-text-primary">
        {{ title }}
      </h2>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <template v-if="productStore.isLoading">
        <div v-for="n in 8" :key="n" class="aspect-square rounded-2xl bg-surface-hover animate-pulse" />
      </template>

      <ProductCard v-else v-for="product in products" :key="product.id" :product="product" class="h-full" />
    </div>
  </section>
</template>