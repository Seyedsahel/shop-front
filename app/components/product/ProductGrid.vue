<!-- app/components/product/ProductGrid.vue -->
<script setup lang="ts">
const props = defineProps<{
  category: string
  title?: string
  variant?: 'default' | 'compact'
}>()

const productStore = useProductStore()

onMounted(() => {
  productStore.fetchByCategory(props.category)
})

const products = computed(() => productStore.byCategory[props.category] ?? [])

// --- Row-overflow detection ---
// Column count changes per breakpoint (2/4/7), so "one row" has no fixed
// height — it must be measured from the actual rendered cards, not guessed
// from the Tailwind classes.
const gridRef = ref<HTMLElement>()
const exceedsOneRow = ref(false)
const rowHeight = ref(0)
let observer: ResizeObserver | undefined

function checkOverflow() {
  const el = gridRef.value
  if (!el || el.children.length < 2) {
    exceedsOneRow.value = false
    return
  }
  const first = el.children[0] as HTMLElement
  const last = el.children[el.children.length - 1] as HTMLElement
  rowHeight.value = first.offsetHeight
  exceedsOneRow.value = last.offsetTop > first.offsetTop + 4 // tolerance for rounding
}

onMounted(() => {
  if (!import.meta.client || !gridRef.value) return
  observer = new ResizeObserver(checkOverflow)
  observer.observe(gridRef.value)
})

onBeforeUnmount(() => observer?.disconnect())

watch(products, () => nextTick(checkOverflow))

const peekPx = 120 // how much of row 2 stays visible under the fade
const clipStyle = computed(() =>
  exceedsOneRow.value ? { maxHeight: `${rowHeight.value + peekPx}px` } : {}
)
</script>

<template>
  <section class="max-w-full mx-auto px-6 sm:px-8 lg:px-24 py-10">
    <div class="flex justify-center items-center mb-7">
      <h2 v-if="title" class="text-lg sm:text-2xl font-semibold text-text-primary">
        {{ title }}
      </h2>
    </div>

    <div class="relative">
      <div
        ref="gridRef"
        class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-7 gap-4 overflow-hidden transition-[max-height] duration-300"
        :style="clipStyle"
      >
        <template v-if="productStore.isLoading">
          <div v-for="n in 8" :key="n" class="aspect-square bg-loading rounded-2xl bg-surface-hover animate-pulse" />
        </template>

        <ProductCard
          v-else
          v-for="product in products"
          :key="product.id"
          :product="product"
          :variant="variant"
          class="h-full"
        />
      </div>

      <div
        v-if="exceedsOneRow"
        class="absolute inset-x-0 bottom-0 h-20 flex items-end justify-center pb-4 bg-linear-to-t from-surface via-surface/50 to-transparent backdrop-blur-sm rounded-b-md"
      >
        <UButton
          :to="`/category/${category}`"
          variant="soft"
          class="bg-secondary hover:bg-secondary/80 text-text-on-dark px-6 py-2 rounded-xl"
        >
          مشاهده همه
        </UButton>
      </div>
    </div>
  </section>
</template>