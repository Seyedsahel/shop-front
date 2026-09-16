<script setup lang="ts">
const props = defineProps<{ filter: FilterDefinition }>()
const filterStore = useFilterStore()

const value = computed({
  get: () => filterStore.values[props.filter.slug] ?? null,
  set: (v) => filterStore.setValue(props.filter.slug, v),
})

const colorClasses: Record<string, string> = {
  Black: 'bg-black',
  Blue: 'bg-blue-500',
  Clear: 'bg-gradient-to-tr from-gray-100 to-white',
  Green: 'bg-emerald-500',
  Grey: 'bg-gray-400',
  Pink: 'bg-rose-400',
  Red: 'bg-red-500',
  White: 'bg-white',
  Yellow: 'bg-yellow-400',
}

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
    <div v-if="filter.dataType === 'multiselect'" class="flex flex-col gap-2">
      <label v-for="option in filter.availableValues" :key="option" class="flex items-center justify-between rounded-lg px-1 py-1.5 text-sm text-text-secondary hover:bg-surface-hover">
        <span>{{ option }}</span>
        <input type="checkbox" class="size-4 rounded border-border-strong accent-primary" :checked="(value as string[])?.includes(option)" @change="toggleMultiselect(option)" />
      </label>
    </div>

    <div v-else class="flex flex-col gap-2">
      <label v-for="option in filter.availableValues" :key="option" class="flex items-center justify-between rounded-lg px-1 py-1.5 text-sm text-text-secondary hover:bg-surface-hover">
        <span class="flex items-center gap-2">
          <span v-if="filter.slug === 'color'" class="size-3.5 rounded-full border border-border-strong" :class="colorClasses[option] ?? 'bg-surface'" />
          {{ option }}
        </span>
        <input type="radio" :name="filter.slug" class="size-4 accent-primary" :checked="value === option" @change="value = option" />
      </label>
    </div>
  </UiAccordion>
</template>
