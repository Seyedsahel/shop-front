<script setup lang="ts">
defineOptions({ inheritAttrs: false })
withDefaults(defineProps<{ title?: string; side?: 'start' | 'end' }>(), {
  side: 'start',
})

const open = defineModel<boolean>({ required: true })
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="open" class="fixed inset-0 z-100 bg-overlay" @click="open = false" />
    </Transition>

    <Transition
      :enter-active-class="`transition duration-250 ease-out`"
      :enter-from-class="side === 'start' ? '-translate-x-full rtl:translate-x-full' : 'translate-x-full rtl:-translate-x-full'"
      :leave-active-class="`transition duration-200 ease-in`"
      :leave-to-class="side === 'start' ? '-translate-x-full rtl:translate-x-full' : 'translate-x-full rtl:-translate-x-full'"
    >
      <div
        v-if="open"
        class="fixed inset-y-0 z-101 w-72 max-w-[85vw] bg-surface shadow-xl flex flex-col"
        :class="[side === 'start' ? 'inset-s-0' : 'inset-e-0',$attrs.class]"
      >
        <div class="flex items-center justify-between h-14 px-4 border-b border-divider shrink-0">
          <span v-if="title" class="text-sm font-semibold text-text-primary">{{ title }}</span>
          <button class="text-text-secondary" @click="open = false">
            <UIcon name="solar:close-circle-broken" class="size-6" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>