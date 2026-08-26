<script setup lang="ts">
const filterStore = useFilterStore()
onMounted(() => filterStore.fetchFilters())

defineEmits<{ apply: [] }>()
</script>

<template>
  <div class="flex flex-col">
    <div class="flex items-center justify-between mb-2">
        <div class="flex justify-center gap-2">
            <h2 class="text-sm font-semibold text-text-primary">فیلترها</h2>
            <span v-if="filterStore.activeCount > 0" class="bg-secondary text-white text-xs rounded-full size-5 flex items-center justify-center">
            {{ filterStore.activeCount }}
          </span>
        </div>
      <button v-if="filterStore.activeCount > 0" class="text-xs text-danger" @click="filterStore.resetAll">
        حذف فیلترها
      </button>
    </div>

    <template v-if="filterStore.isLoading">
      <div v-for="n in 5" :key="n" class="h-12 my-2 rounded-lg bg-loading animate-pulse" />
    </template>

    <FilterGroup v-else v-for="filter in filterStore.definitions" :key="filter.id" :filter="filter" />
  </div>
</template>