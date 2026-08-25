<script setup lang="ts">
const props = defineProps<{ filter: FilterDefinition }>()
const filterStore = useFilterStore()

const value = computed({
  get: () => filterStore.values[props.filter.id],
  set: (v) => v !== undefined && filterStore.setValue(props.filter.id, v),
})

function toggleCheckboxOption(optionId: string) {
  const current = (value.value as string[] | null) ?? []
  value.value = current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId]
}
</script>

<template>
  <!-- Toggle: standalone row, no accordion -->
  <div v-if="filter.type === 'toggle'" class="flex items-center justify-between py-3.5 border-b border-divider">
    <div class="flex items-center gap-2">
      <UIcon v-if="filter.icon" :name="filter.icon" class="size-4 text-text-secondary" />
      <div>
        <p class="text-sm text-text-primary">{{ filter.label }}</p>
        <p v-if="filter.description" class="text-xs text-text-muted">{{ filter.description }}</p>
      </div>
    </div>
    <UiSwitch v-model="value as boolean" />
  </div>

  <!-- Everything else: accordion -->
  <UiAccordion v-else :title="filter.label" :icon="filter.icon">
    <div v-if="filter.type === 'color'" class="flex flex-wrap gap-3">
      <button
        v-for="option in filter.options"
        :key="option.id"
        type="button"
        class="size-9 rounded-full border-2 transition-colors"
        :style="{ backgroundColor: option.hex }"
        :class="(value as string[])?.includes(option.id) ? 'border-danger' : 'border-divider'"
        :aria-label="option.label"
        @click="toggleCheckboxOption(option.id)"
      />
    </div>

    <div v-else-if="filter.type === 'checkbox'" class="flex flex-col gap-3">
      <label v-for="option in filter.options" :key="option.id" class="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          class="size-4"
          :checked="(value as string[])?.includes(option.id)"
          @change="toggleCheckboxOption(option.id)"
        />
        {{ option.label }}
      </label>
    </div>

    <div v-else-if="filter.type === 'radio'" class="flex flex-col gap-3">
      <label v-for="option in filter.options" :key="option.id" class="flex items-center gap-2 text-sm text-text-secondary">
        <input type="radio" :name="filter.id" class="size-4" :checked="value === option.id" @change="value = option.id" />
        {{ option.label }}
      </label>
    </div>

    <div v-else-if="filter.type === 'range'" class="flex flex-col gap-2">
      <input
        type="range" :min="filter.min" :max="filter.max" :step="filter.step ?? 1"
        :value="(value as [number, number])?.[1] ?? filter.max"
        class="w-full"
        @input="value = [filter.min, +($event.target as HTMLInputElement).value]"
      />
      <div class="flex justify-between text-xs text-text-muted">
        <span>{{ filter.min.toLocaleString('fa-IR') }}</span>
        <span>{{ ((value as [number, number])?.[1] ?? filter.max).toLocaleString('fa-IR') }}</span>
      </div>
    </div>
  </UiAccordion>
</template>