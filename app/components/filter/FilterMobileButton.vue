<script setup lang="ts">
defineOptions({ inheritAttrs: false })
const filterStore = useFilterStore()
const open = ref(false)
</script>

<template>
  <button
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

  <Teleport to="body">
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="open" class="fixed inset-0 z-100 bg-surface flex flex-col">
        <div class="flex items-center justify-between h-14 px-4 border-b border-divider shrink-0">
          <span class="text-sm font-semibold text-text-primary">فیلترها</span>
          <button class="text-text-secondary" @click="open = false">
            <UIcon name="solar:close-circle-broken" class="size-6" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto px-4 py-2">
          <FilterPanel />
        </div>
        <div class="border-t border-divider p-4 shrink-0">
          <button class="w-full bg-primary hover:bg-primary-hover text-primary-foreground py-2.5 rounded-xl text-sm font-medium" @click="open = false">
            اعمال فیلتر
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>