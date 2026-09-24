<script setup lang="ts">
const props = defineProps<{ title: string; dismissible?: boolean }>()
const open = defineModel<boolean>({ required: true })
const dialog = ref<HTMLDialogElement | null>(null)
const titleId = useId()
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
  previousFocus?.focus()
}
function closeFromBackdrop(event: MouseEvent) {
  if (event.target === dialog.value && props.dismissible !== false) open.value = false
}
watch(open, syncOpen, { flush: 'post' })
onMounted(syncOpen)
onBeforeUnmount(() => { dialog.value?.close(); unlockScroll(); previousFocus?.focus() })
</script>

<template>
  <ClientOnly>
  <Teleport to="#teleports">
    <dialog ref="dialog" :aria-labelledby="titleId" class="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg max-h-[85dvh] overflow-auto rounded-2xl border border-border bg-card p-0 text-text-primary shadow-xl backdrop:bg-overlay" @close="closed" @cancel="dismissible === false ? $event.preventDefault() : open = false" @click="closeFromBackdrop">
      <div class="p-5 sm:p-6">
        <div class="mb-5 flex items-center justify-between gap-4">
          <h2 :id="titleId" class="text-lg font-bold">{{ title }}</h2>
          <button type="button" :disabled="dismissible === false" aria-label="بستن" class="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-surface disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-primary" @click="open = false"><UIcon name="solar:close-circle-broken" class="size-6" /></button>
        </div>
        <slot />
      </div>
    </dialog>
  </Teleport>
  </ClientOnly>
</template>
