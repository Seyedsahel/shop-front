<script setup lang="ts">
defineProps<{ title?: string }>()
const open = defineModel<boolean>({ required: true })
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="open" class="fixed inset-0 z-100 bg-charcoal/50" @click="open = false" />
    </Transition>

    <Transition
      enter-active-class="transition duration-250 ease-out" enter-from-class="translate-y-full"
      leave-active-class="transition duration-200 ease-in" leave-to-class="translate-y-full"
    >
      <div v-if="open" class="fixed bottom-0 inset-x-0 z-101 max-h-[80vh] bg-surface rounded-t-2xl shadow-xl flex flex-col">
        <div class="flex justify-center pt-2.5 pb-1 shrink-0">
          <div class="w-10 h-1 rounded-full bg-border-strong" />
        </div>
        <div class="flex items-center justify-between px-4 pb-3 border-b border-divider shrink-0">
          <button class="text-text-secondary" @click="open = false">
            <UIcon name="solar:close-circle-broken" class="size-6" />
          </button>
          <span v-if="title" class="text-sm font-semibold text-text-primary">{{ title }}</span>
        </div>
        <div class="flex-1 overflow-y-auto">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>