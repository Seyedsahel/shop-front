<script setup lang="ts">
const filterStore = useFilterStore()

const minValue = computed(() => filterStore.priceRange.min)
const maxValue = computed(() => filterStore.priceRange.max)
const selectedMax = computed({
  get: () => filterStore.selectedPriceMax ?? maxValue.value,
  set: value => filterStore.setPriceRange(minValue.value, value),
})

const step = computed(() => {
  const span = maxValue.value - minValue.value
  if (span <= 100) return 1
  if (span <= 1000) return 10
  return 5000
})
</script>

<template>
  <UiAccordion title="محدوده قیمت">
    <div class="flex flex-col gap-2">
      <input
        type="range"
        :min="minValue" :max="maxValue" :step="step"
        v-model.number="selectedMax"
        class="w-full accent-primary"
      />
      <div class="flex justify-between text-xs text-text-muted">
        <span>{{ minValue.toLocaleString('fa-IR') }}</span>
        <span class="rounded-md border border-border-strong bg-surface px-2 py-0.5 text-text-primary">
          {{ selectedMax.toLocaleString('fa-IR') }}
        </span>
        <span>{{ maxValue.toLocaleString('fa-IR') }}</span>
      </div>
    </div>
  </UiAccordion>
</template>
