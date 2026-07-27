<script setup lang="ts">
const props = defineProps<{ 
  category: string;
  title?: string
  variant?: 'default' | 'compact'
   }>()
const productStore = useProductStore()

onMounted(() => {
  productStore.fetchByCategory(props.category)
})

const products = computed(() => productStore.byCategory[props.category] ?? [])

const track = ref<HTMLElement>()
function scrollByCard(direction: 1 | -1) {
  track.value?.scrollBy({ left: direction * 240, behavior: 'smooth' })
}
</script>

<template>
  <section class="max-w-dvw mx-auto px-4 sm:px-6 lg:px-16 py-10">
    <div class="flex justify-center items-center mb-7">
      <h2 v-if="title" class="text-lg sm:text-2xl font-semibold text-text-primary">
        {{ title }}
      </h2>
    </div>

    <div class="flex items-center justify-center gap-3.5">
      <button
          class="p-1.5 sm:p-2 flex items-center justify-center rounded-full border border-border-strong text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          @click="scrollByCard(1)"
        >
          <UIcon name="solar:arrow-right-broken" class="size-4" />
        </button>
    <div
      ref="track"
      class="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none"
    >
      <template v-if="productStore.isLoading">
        <div v-for="n in 5" :key="n" class="w-40 bg-loading sm:w-44 shrink-0 aspect-square rounded-2xl bg-surface-hover animate-pulse" />
      </template>

      <div v-else v-for="product in products" :key="product.id" class="w-40 sm:w-44 shrink-0 snap-start">
        <ProductCard
         :product="product"
         :variant="variant"
          />
      </div>
    </div>
    <button
          class="p-1.5 sm:p-2 flex items-center justify-center rounded-full border border-border-strong text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          @click="scrollByCard(-1)"
        >
          <UIcon name="solar:arrow-left-broken" class="size-4" />
        </button>
        </div>
  </section>
</template>