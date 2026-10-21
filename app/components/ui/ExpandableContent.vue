<script setup lang="ts">
const props = withDefaults(defineProps<{
  collapsedHeight?: number
}>(), {
  collapsedHeight: 384,
})

const contentId = useId()
const viewport = ref<HTMLElement>()
const content = ref<HTMLElement>()
const expanded = ref(false)
const contentHeight = ref(0)
const hasOverflow = computed(() => contentHeight.value > props.collapsedHeight + 1)
const maxHeight = computed(() => `${expanded.value ? contentHeight.value : props.collapsedHeight}px`)
let observer: ResizeObserver | undefined

function measureContent() {
  if (!content.value) return
  contentHeight.value = content.value.getBoundingClientRect().height
}

// Keyboard navigation must reveal controls that lie below the clipped preview.
function revealFocusedControl(event: FocusEvent) {
  if (expanded.value || !viewport.value || !(event.target instanceof HTMLElement)) return
  const bounds = viewport.value.getBoundingClientRect()
  const focusedBottom = event.target.getBoundingClientRect().bottom - bounds.top + viewport.value.scrollTop
  if (focusedBottom > props.collapsedHeight) {
    expanded.value = true
    viewport.value.scrollTop = 0
  }
}

onMounted(() => {
  if (!content.value) return
  measureContent()
  observer = new ResizeObserver(measureContent)
  observer.observe(content.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="min-w-0">
    <div class="relative">
      <div
        :id="contentId"
        ref="viewport"
        class="overflow-hidden transition-[max-height] duration-300 ease-in-out motion-reduce:transition-none"
        :style="{ maxHeight }"
        @focusin="revealFocusedControl"
      >
        <div ref="content" class="flow-root">
          <slot />
        </div>
      </div>
      <div
        v-if="hasOverflow"
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-card to-transparent transition-opacity duration-300 motion-reduce:transition-none"
        :class="expanded ? 'opacity-0' : 'opacity-100'"
      />
    </div>

    <button
      v-if="hasOverflow"
      type="button"
      :aria-expanded="expanded"
      :aria-controls="contentId"
      class="mx-auto mt-4 flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'مشاهده کمتر' : 'مشاهده بیشتر' }}
      <UIcon
        name="solar:alt-arrow-down-outline"
        class="size-4 transition-transform duration-300 motion-reduce:transition-none"
        :class="{ 'rotate-180': expanded }"
        aria-hidden="true"
      />
    </button>
  </div>
</template>
