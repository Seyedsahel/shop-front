<script setup lang="ts">
const categoryStore = useCategoryStore()
const productListStore = useProductListStore()

onMounted(() => {
  categoryStore.fetchCategories()
  productListStore.fetchDiscountedAvailability()
})
const emit = defineEmits<{ close: [] }>() 
const tree = computed(()=> buildCategoryTree(categoryStore.items))
</script>

<template>
  <div class="flex flex-col">
    <template v-if="categoryStore.isLoading">
      <div v-for="n in 6" :key="n" class="h-10 mx-2 my-1 rounded-lg bg-loading animate-pulse" />
    </template>
    <template v-else>
      <NuxtLink
        v-if="productListStore.hasDiscountedProducts"
        to="/discounts/products"
        class="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-danger hover:bg-surface transition-colors"
        @click="emit('close')"
      >
        <span class="flex items-center gap-2"><UIcon name="solar:tag-price-bold" class="size-4" /> تخفیف‌ها</span>
        <UIcon name="solar:alt-arrow-left-linear" class="size-4" />
      </NuxtLink>

      <NavCategoryTreeItem
        v-for="root in tree"
        :key="root.id"
        class="px-4"
        :node="root"
        @close="emit('close')"
      />
    </template>

  </div>
</template>
