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

onMounted(() => {
  if (props.autofocus) input.value?.focus()
})

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
      :placeholder="placeholder"
      class="w-full bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
      @focus="emit('focus')"
    />
    <button
      v-if="query"
      type="button"
      class="shrink-0 text-text-muted hover:text-text-primary transition-colors"
      @click="clear"
    >
      <UIcon name="solar:close-circle-broken" class="size-5" />
    </button>
  </form>
</template>
