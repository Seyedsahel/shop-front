<script setup lang="ts">
const open = defineModel<boolean>({ required: true })
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200" enter-from-class="opacity-0"
      leave-active-class="transition duration-150" leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-100 bg-surface flex flex-col">
        <div class="flex items-center gap-3 px-4 h-16 border-b border-divider">
          <UiSearchBar autofocus class="flex-1" />
          <button class="text-text-secondary shrink-0" @click="open = false">
            <UIcon name="solar:close-circle-broken" class="size-6" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>