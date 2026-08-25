<script setup lang="ts">
const props = defineProps<{ autofocus?: boolean }>()
const query = ref('')
const input = ref<HTMLInputElement>()

onMounted(() => {
  if (props.autofocus) input.value?.focus()
})

function submit() {
  if (!query.value.trim()) return
  navigateTo(`/search?q=${encodeURIComponent(query.value)}`)
}
</script>

<template>
  <form class="flex items-center gap-2 rounded-full border border-border-strong bg-surface/60 px-4 py-2 w-full" @submit.prevent="submit">
    <UIcon name="solar:magnifer-linear" class="size-5 text-text-muted shrink-0" />
    <input
      ref="input"
      v-model="query"
      type="text"
      placeholder="جستجوی محصولات و خدمات..."
      class="w-full bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
    />
  </form>
</template>