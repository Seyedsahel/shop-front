<script setup lang="ts">
const props = withDefaults(defineProps<{ min?: number; max?: number; step?: number }>(), {
  min: 0,
  max: 5000000,
  step: 50000,
})

const productListStore = useProductListStore()
const value = ref(props.max)

function apply() {
  productListStore.setPriceRange(props.min, value.value)
}
</script>

<template>
  <UiAccordion title="محدوده قیمت">
    <div class="flex flex-col gap-2">
      <input
        type="range"
        :min="min" :max="max" :step="step"
        v-model.number="value"
        class="w-full"
        @change="apply"
      />
      <div class="flex justify-between text-xs text-text-muted">
        <span>{{ min.toLocaleString('fa-IR') }}</span>
        <span>{{ value.toLocaleString('fa-IR') }}</span>
      </div>
    </div>
  </UiAccordion>
</template>