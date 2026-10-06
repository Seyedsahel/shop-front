<script setup lang="ts">
defineOptions({ inheritAttrs: false })
const filterStore = useFilterStore()
const open = ref(false)
const emit = defineEmits<{ applied: [] }>()
function apply() {
  open.value = false
  emit('applied')
}
</script>

<template>
  <button
    type="button"
    aria-haspopup="dialog"
    :aria-expanded="open"
    class="lg:hidden flex items-center gap-2 w-full justify-center border border-border-strong rounded-xl py-2.5 text-sm text-text-primary"
    @click="open = true"
    v-bind="$attrs"
  >
    <UIcon name="solar:tuning-2-broken" class="size-4" />
    فیلترها
    <span v-if="filterStore.activeCount > 0" class="bg-secondary text-white text-xs rounded-full size-5 flex items-center justify-center">
      {{ filterStore.activeCount }}
    </span>
  </button>

  <UiModal v-model="open" title="فیلترها" placement="fullscreen">
    <template #header="{ titleId, close }">
        <div class="flex items-center justify-between h-14 px-4 border-b border-divider shrink-0">
          <h2 :id="titleId" class="text-sm font-semibold text-text-primary">فیلترها</h2>
          <button type="button" aria-label="بستن فیلترها" class="text-text-secondary focus-visible:outline-2 focus-visible:outline-primary" @click="close">
            <UIcon name="solar:close-circle-broken" class="size-6" />
          </button>
        </div>
    </template>
    <div class="min-h-0 flex-1 overflow-y-auto px-4 py-2">
      <FilterPanel @applied="apply" />
    </div>
  </UiModal>
</template>
