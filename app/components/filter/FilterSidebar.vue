<!-- app/components/filter/FilterSidebar.vue -->
<script setup lang="ts">
const emit = defineEmits<{ applied: [] }>()
</script>
<template>
  <aside class="hidden lg:block w-72 max-h-[calc(100vh-7rem)] shrink-0 overflow-y-auto rounded-2xl border border-border-strong bg-surface p-4 h-fit sticky top-20">
    <FilterPanel @applied="emit('applied')" />
  </aside>
</template>
