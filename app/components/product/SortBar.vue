<script setup lang="ts">
const { activeSort, setSort } = useSort()
const sheetOpen = ref(false)

function select(id: string) {
  setSort(id)
  sheetOpen.value = false
}
</script>

<template>
  <!-- Desktop: inline horizontal bar -->
  <div class="hidden lg:flex items-center gap-5 py-3 border-b border-divider">
    <span class="text-sm text-text-secondary shrink-0">مرتب‌سازی:</span>
    <button
      v-for="option in sortOptions"
      :key="option.id"
      class="text-sm transition-colors"
      :class="activeSort === option.id ? 'text-accent-foreground font-semibold' : 'text-text-secondary hover:text-text-primary'"
      @click="setSort(option.id)"
    >
      {{ option.label }}
    </button>
  </div>

  <!-- Mobile: trigger button -->
  <button
    class="lg:hidden flex items-center gap-2 border border-border-strong rounded-xl px-4 py-2.5 text-sm text-text-primary whitespace-nowrap"
    @click="sheetOpen = true"
  >
    <UIcon name="solar:sort-vertical-broken" class="size-4" />
    {{ sortOptions.find(o => o.id === activeSort)?.label }}
  </button>

  <UiBottomSheet v-model="sheetOpen" title="مرتب سازی بر اساس">
    <button
      v-for="option in sortOptions"
      :key="option.id"
      class="w-full flex items-center justify-between px-4 py-3.5 text-sm border-b border-divider"
      :class="activeSort === option.id ? 'text-text-primary font-medium' : 'text-text-secondary'"
      @click="select(option.id)"
    >
      {{ option.label }}
      <UIcon v-if="activeSort === option.id" name="solar:check-circle-broken" class="size-4 text-accent-foreground" />
    </button>
  </UiBottomSheet>
</template>