<!-- app/components/filter/FilterSidebar.vue -->
<script setup lang="ts">
const emit = defineEmits<{ applied: [] }>()
</script>
<template>
  <aside class="hidden lg:block w-72 shrink-0 overflow-hidden rounded-2xl border border-border-strong bg-surface h-fit sticky top-20">
    <div class="max-h-[calc(100vh-7rem-2px)] overflow-y-auto p-4">
      <FilterPanel id-prefix="product-filters-desktop" @applied="emit('applied')" />
    </div>
  </aside>
</template>
