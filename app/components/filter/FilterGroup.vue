<script setup lang="ts">
const props = defineProps<{ filter: FilterDefinition }>()
const filterStore = useFilterStore()

const value = computed({
  get: () => filterStore.values[props.filter.slug] ?? null,
  set: (v) => filterStore.setValue(props.filter.slug, v),
})

function toggleMultiselect(option: string) {
  const current = (value.value as string[]) ?? []
  value.value = current.includes(option) ? current.filter(v => v !== option) : [...current, option]
}

// Boolean filters call the store directly — no computed indirection,
// no ambiguity about whether the assignment round-trips correctly.
function onToggle(checked: boolean) {
  filterStore.setValue(props.filter.slug, String(checked))
}
</script>

<template>
  <!-- boolean: standalone toggle row, no accordion -->
  <div v-if="filter.dataType === 'boolean'" class="flex items-center justify-between py-3.5 border-b border-divider">
    <p class="text-sm text-text-primary">{{ filter.name }}</p>
    <UiSwitch :model-value="filterStore.values[filter.slug] === 'true'" @update:model-value="onToggle" />
  </div>

  <!-- everything else: accordion -->
  <UiAccordion v-else :title="filter.name">
    <div v-if="filter.dataType === 'multiselect'" class="flex flex-col gap-3">
      <label v-for="option in filter.availableValues" :key="option" class="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" class="size-4" :checked="(value as string[])?.includes(option)" @change="toggleMultiselect(option)" />
        {{ option }}
      </label>
    </div>

    <div v-else class="flex flex-col gap-3">
      <label v-for="option in filter.availableValues" :key="option" class="flex items-center gap-2 text-sm text-text-secondary">
        <input type="radio" :name="filter.slug" class="size-4" :checked="value === option" @change="value = option" />
        {{ option }}
      </label>
    </div>
  </UiAccordion>
</template>