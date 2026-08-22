<script setup lang="ts">
const categoryStore = useCategoryStore()
onMounted(() => categoryStore.fetchCategories())

defineEmits<{ close: [] }>()
</script>

<template>
  <div class="flex flex-col">
    <template v-if="categoryStore.isLoading">
      <div v-for="n in 6" :key="n" class="h-10 mx-2 my-1 rounded-lg bg-loading animate-pulse" />
    </template>

    <NuxtLink
      v-else
      v-for="category in categoryStore.items"
      :key="category.id"
      :to="`/category/${category.slug}`"
      class="flex items-center justify-between px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
      @click="$emit('close')"
    >
      {{ category.name }}
      <UIcon name="solar:alt-arrow-left-linear" class="size-4 text-text-muted" />
    </NuxtLink>
  </div>
</template>