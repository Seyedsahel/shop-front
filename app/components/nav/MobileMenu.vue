<!-- components/nav/MobileMenu.vue -->
<script setup lang="ts">
defineProps<{ links: { label: string; href: string }[] }>()
const open = defineModel<boolean>()
</script>

<template>
  <Transition enter-from-class="opacity-0 -translate-y-2" enter-active-class="transition duration-200"
              leave-to-class="opacity-0 -translate-y-2" leave-active-class="transition duration-150">
    <div v-if="open" class="md:hidden absolute top-16 inset-x-0 bg-surface border-b border-divider px-4 py-3 flex flex-col gap-1">
      <NuxtLink v-for="link in links" :key="link.href" :to="link.href"
        class="py-2 text-sm text-text-secondary hover:text-text-primary border-b border-divider"
        @click="open = false">
        {{ link.label }}
      </NuxtLink>
    </div>
  </Transition>
</template>