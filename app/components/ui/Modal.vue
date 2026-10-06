<script setup lang="ts">
defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  title?: string
  dismissible?: boolean
  showClose?: boolean
  placement?: 'center' | 'start' | 'end' | 'bottom' | 'fullscreen'
}>(), { placement: 'center', dismissible: true, showClose: true })
const open = defineModel<boolean>({ required: true })
const dialog = ref<HTMLDialogElement | null>(null)
const titleId = useId()
const dialogClasses = computed(() => {
  if (props.placement === 'bottom') return 'inset-x-0 bottom-0 top-auto m-0 w-full max-w-none max-h-[80dvh] rounded-t-2xl bg-surface'
  if (props.placement === 'fullscreen') return 'inset-0 m-0 h-dvh max-h-dvh w-full max-w-none border-0 bg-surface'
  if (props.placement === 'start' || props.placement === 'end') {
    return `inset-y-0 m-0 h-dvh max-h-dvh w-72 max-w-[85vw] bg-surface ${props.placement === 'start' ? 'inset-s-0 inset-e-auto' : 'inset-e-0 inset-s-auto'}`
  }
  return 'inset-0 m-auto w-[calc(100%-2rem)] max-w-lg max-h-[85dvh] rounded-2xl'
})
let previousOverflow: string | null = null
let previousFocus: HTMLElement | null = null

function syncOpen() {
  if (!dialog.value) return
  if (open.value && !dialog.value.open) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.value.showModal()
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else if (!open.value && dialog.value.open) dialog.value.close()
}
function unlockScroll() {
  if (previousOverflow !== null) {
    document.body.style.overflow = previousOverflow
    previousOverflow = null
  }
}
function closed() {
  unlockScroll()
  open.value = false
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
}
function closeFromBackdrop(event: MouseEvent) {
  if (event.target === dialog.value && props.dismissible !== false) open.value = false
}
watch([open, dialog], syncOpen, { flush: 'post' })
onMounted(syncOpen)
onBeforeUnmount(() => { dialog.value?.close(); unlockScroll(); if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }) })
</script>

<template>
  <ClientOnly>
  <Teleport to="#teleports">
    <dialog ref="dialog" v-bind="$attrs" :aria-labelledby="titleId" aria-modal="true" class="fixed overflow-auto border border-border bg-card p-0 text-text-primary shadow-xl backdrop:bg-overlay" :class="dialogClasses" @close="closed" @cancel="dismissible === false ? $event.preventDefault() : open = false" @click="closeFromBackdrop">
      <div :class="placement === 'center' ? 'p-5 sm:p-6' : 'flex h-full min-h-0 flex-col'">
        <slot name="header" :title-id="titleId" :close="() => { if (dismissible !== false) open = false }">
        <div class="mb-5 flex items-center justify-between gap-4">
          <h2 :id="titleId" class="text-lg font-bold">{{ title || 'پنجره' }}</h2>
          <button v-if="showClose !== false" type="button" :disabled="dismissible === false" aria-label="بستن" class="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-surface disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-primary" @click="open = false"><UIcon name="solar:close-circle-broken" class="size-6" /></button>
        </div>
        </slot>
        <slot />
      </div>
    </dialog>
  </Teleport>
  </ClientOnly>
</template>
