<script setup lang="ts">
const categoryStore = useCategoryStore()
onMounted(() => categoryStore.fetchCategories())
</script>

<template>
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex justify-center items-center mb-7">
        <h2 class="text-lg sm:text-xl font-semibold text-text-primary mb-6 text-end">
          دسته‌بندی‌ها
        </h2>
    </div>

    <div class="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-y-6 ">
      <template v-if="categoryStore.isLoading">
        <div v-for="n in 9" :key="n" class="flex flex-col items-center gap-2">
          <div class="size-16 rounded-full bg-loading animate-pulse" />
        </div>
      </template>

      <NuxtLink
        v-else
        v-for="category in categoryStore.items"
        :key="category.id"
        :to="`/products?category=${category.slug}`"
        class="flex flex-col items-center gap-2 group"
      >
        <div class="size-20 md:size-28 rounded-full bg-surface overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
          <img :src="category.imageUrl" :alt="category.name" class="size-full object-cover" />
        </div>
        <span class="text-xs md:text-sm text-text-secondary text-center leading-tight">
          {{ category.name }}
        </span>
      </NuxtLink>
    </div>
  </section>
</template>