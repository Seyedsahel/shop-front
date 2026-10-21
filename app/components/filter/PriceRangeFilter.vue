<script setup lang="ts">
defineProps<{ panelId: string }>()
const filterStore = useFilterStore()

const minValue = computed(() => filterStore.priceRange.min)
const maxValue = computed(() => filterStore.priceRange.max)
const selectedMin = computed(() => filterStore.selectedPriceMin ?? minValue.value)
const selectedMax = computed(() => filterStore.selectedPriceMax ?? maxValue.value)

const selectedRange = computed({
  get: () => [selectedMin.value, selectedMax.value],
  set: (value: number[]) => {
    const [min, max] = value
    if (min === undefined || max === undefined) return
    filterStore.setPriceRange(min, max)
  },
})

function formatPrice(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function priceDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 1632))
    .replace(/\D/g, '')
}

function formatPriceInput(event: Event) {
  const input = event.target as HTMLInputElement
  const digitsBeforeCaret = priceDigits(input.value.slice(0, input.selectionStart ?? input.value.length)).length
  input.value = priceDigits(input.value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  let caret = 0
  let digits = 0
  while (caret < input.value.length && digits < digitsBeforeCaret) {
    if (input.value[caret] !== ',') digits++
    caret++
  }
  input.setSelectionRange(caret, caret)
}

function updatePrice(bound: 'min' | 'max', event: Event) {
  const input = event.target as HTMLInputElement
  const rawValue = priceDigits(input.value)
  const value = rawValue ? Number(rawValue) : NaN
  if (Number.isFinite(value)) {
    if (bound === 'min') {
      filterStore.setPriceRange(Math.min(selectedMax.value, Math.max(minValue.value, value)), selectedMax.value)
    } else {
      filterStore.setPriceRange(selectedMin.value, Math.max(selectedMin.value, Math.min(maxValue.value, value)))
    }
  }
  input.value = formatPrice(bound === 'min' ? selectedMin.value : selectedMax.value)
}
</script>

<template>
  <UiAccordion :panel-id="panelId" title="محدوده قیمت">
    <div class="flex flex-col gap-4">
      <div dir="ltr" class="px-2 py-2">
        <USlider
          v-model="selectedRange"
          aria-label="محدوده قیمت"
          :min="minValue"
          :max="maxValue"
          :step="1"
          :disabled="minValue === maxValue"
          :ui="{ track: 'w-full h-1 bg-accent', range: 'h-full bg-primary', thumb: 'bg-primary ring-primary' }"
        />
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs text-text-muted">
        <label class="flex min-w-0 flex-col gap-1 text-center">
          <input
          type="text"
          inputmode="numeric"
          dir="ltr"
          :value="formatPrice(selectedMin)"
          class="w-full min-w-0 rounded-md border border-border-strong bg-surface px-2 py-1.5 text-text-primary text-center"
          @input="formatPriceInput"
          @change="updatePrice('min', $event)"
          />
          <span>حداقل قیمت</span>
        </label>
        <label class="flex min-w-0 flex-col gap-1 text-center">
          <input
          type="text"
          inputmode="numeric"
          dir="ltr"
          :value="formatPrice(selectedMax)"
          class="w-full min-w-0 rounded-md border border-border-strong bg-surface px-2 py-1.5 text-text-primary text-center"
          @input="formatPriceInput"
          @change="updatePrice('max', $event)"
          />
          <span>حداکثر قیمت</span>
        </label>
      </div>
    </div>
  </UiAccordion>
</template>
