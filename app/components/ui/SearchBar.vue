<script setup lang="ts">
const props = withDefaults(defineProps<{
  autofocus?: boolean
  navigateOnSubmit?: boolean
  placeholder?: string
}>(), {
  navigateOnSubmit: true,
  placeholder: 'جستجوی محصولات و خدمات...',
})

const emit = defineEmits<{
  submit: [query: string]
  focus: []
  clear: []
}>()

const query = defineModel<string>({ default: '' })
const input = ref<HTMLInputElement>()

function submit() {
  if (!query.value.trim()) return
  emit('submit', query.value.trim())
  if (props.navigateOnSubmit) navigateTo(`/products?search=${encodeURIComponent(query.value.trim())}`)
}

function clear() {
  query.value = ''
  emit('clear')
  input.value?.focus()
}
</script>

<template>
  <form class="flex items-center gap-2 rounded-full border border-border-strong bg-surface/60 px-4 py-2 w-full" @submit.prevent="submit">
    <UIcon name="solar:magnifer-linear" class="size-5 text-text-muted shrink-0" />
    <input
      ref="input"
      v-model="query"
      type="search"
      :autofocus="autofocus"
      :aria-label="placeholder"
      :placeholder="placeholder"
      class="min-w-0 w-full bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
      @focus="emit('focus')"
    />
    <button
      v-if="query"
      type="button"
      aria-label="پاک کردن جستجو"
      class="flex size-5 shrink-0 items-center justify-center text-text-muted hover:text-text-primary transition-colors"
      @click="clear"
    >
      <UIcon name="solar:close-circle-broken" class="size-5" />
    </button>
  </form>
</template>

<style scoped>
input::-webkit-search-cancel-button,
input::-webkit-search-decoration {
  -webkit-appearance: none;
}
</style>
