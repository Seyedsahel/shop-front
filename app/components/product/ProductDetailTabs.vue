<script setup lang="ts">
const props = defineProps<{ product: ProductDetail }>()
const activeTab = ref(props.product.descriptionBlocks.length ? 'block-0' : 'comments')
const tabTrack = ref<{ revealItem: (index: number) => void }>()
const commentStore = useCommentStore()
const commentKey = computed(() => commentStore.keyFor('product', props.product.id))
const commentCount = computed(() => {
  if (!Object.hasOwn(commentStore.byTarget, commentKey.value)) return undefined
  return (commentStore.byTarget[commentKey.value]?.length ?? 0)
    + (commentStore.pendingByTarget[commentKey.value]?.length ?? 0)
})

await callOnce(`comments:product:${props.product.id}`, () => commentStore.fetchComments('product', props.product.id), { mode: 'navigation' })
watch(() => props.product.id, id => { void commentStore.fetchComments('product', id) })

const tabs = computed(() => [
  ...props.product.descriptionBlocks.map((block, index) => ({ id: `block-${index}`, label: block.title })),
  { id: 'comments', label: 'نظرات کاربران' },
])

watch(() => props.product.descriptionBlocks.length, () => {
  if (!tabs.value.some(tab => tab.id === activeTab.value)) {
    activeTab.value = props.product.descriptionBlocks.length ? 'block-0' : 'comments'
  }
})

watch(activeTab, async () => {
  await nextTick()
  tabTrack.value?.revealItem(tabs.value.findIndex(tab => tab.id === activeTab.value))
})

async function onTabKeydown(event: KeyboardEvent, index: number) {
  let nextIndex: number
  switch (event.key) {
    case 'ArrowLeft': nextIndex = (index + 1) % tabs.value.length; break
    case 'ArrowRight': nextIndex = (index - 1 + tabs.value.length) % tabs.value.length; break
    case 'Home': nextIndex = 0; break
    case 'End': nextIndex = tabs.value.length - 1; break
    default: return
  }
  event.preventDefault()
  const tab = tabs.value[nextIndex]
  if (!tab) return
  activeTab.value = tab.id
  await nextTick()
  document.getElementById(`product-${tab.id}-tab`)?.focus({ preventScroll: true })
}
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-border bg-card">
    <UiScrollTrack ref="tabTrack" variant="tabs" aria-label="اطلاعات تکمیلی محصول" class="border-b border-divider bg-surface p-2">
      <button
        v-for="(tab, index) in tabs"
        :id="`product-${tab.id}-tab`"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-controls="`product-${tab.id}-panel`"
        :aria-selected="activeTab === tab.id"
        :tabindex="activeTab === tab.id ? 0 : -1"
        class="inline-flex items-center gap-2 shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        :class="activeTab === tab.id ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:bg-card hover:text-text-primary'"
        @click="activeTab = tab.id"
        @focus="tabTrack?.revealItem(index)"
        @keydown="onTabKeydown($event, index)"
      >
        {{ tab.label }}
        <UiCounterBadge v-if="tab.id === 'comments' && commentCount !== undefined" :count="commentCount" placement="inline" />
      </button>
    </UiScrollTrack>

    <div class="p-5 sm:p-6">
      <template v-for="(block, index) in product.descriptionBlocks" :key="index">
        <div v-if="activeTab === `block-${index}`" :id="`product-block-${index}-panel`" role="tabpanel" :aria-labelledby="`product-block-${index}-tab`">
          <template v-if="block.type === 'text'">
            <h2 v-if="block.title" class="text-xl font-semibold text-text-primary">{{ block.title }}</h2>
            <p class="mt-3 whitespace-pre-line text-sm leading-8 text-text-secondary sm:text-base">{{ block.body }}</p>
          </template>

          <figure v-else-if="block.type === 'image'" class="overflow-hidden rounded-2xl border border-border bg-surface">
            <div class="aspect-video w-full bg-surface-hover">
              <img v-if="block.imageUrl" :src="block.imageUrl" :alt="block.title || product.name" class="size-full object-cover" loading="lazy">
              <div v-else class="flex size-full flex-col items-center justify-center gap-2 text-text-muted">
                <UIcon name="solar:gallery-remove-outline" class="size-10" />
                <span class="text-sm">تصویری برای این بخش ثبت نشده است.</span>
              </div>
            </div>
            <figcaption v-if="block.title" class="px-4 py-3 text-sm text-text-secondary">{{ block.title }}</figcaption>
          </figure>

          <blockquote v-else-if="block.type === 'quote'" class="rounded-2xl border-s-4 border-primary bg-surface px-5 py-4">
            <h2 v-if="block.title" class="mb-2 text-base font-semibold text-text-primary">{{ block.title }}</h2>
            <p class="whitespace-pre-line text-base leading-8 text-text-secondary">{{ block.body }}</p>
          </blockquote>

          <section v-else-if="block.type === 'video'" class="overflow-hidden rounded-2xl border border-border bg-surface">
            <div class="aspect-video w-full bg-black">
              <video v-if="block.videoUrl" controls preload="metadata" class="product-video size-full object-cover" :aria-label="block.title || product.name">
                <source :src="block.videoUrl">
                مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
              </video>
              <div v-else class="flex size-full flex-col items-center justify-center gap-2 text-white">
                <UIcon name="solar:video-frame-play-horizontal-outline" class="size-10" />
                <span class="text-sm">ویدیویی برای این بخش ثبت نشده است.</span>
              </div>
            </div>
            <div v-if="block.title || block.body" class="p-4">
              <h2 v-if="block.title" class="text-base font-semibold text-text-primary">{{ block.title }}</h2>
              <p v-if="block.body" class="mt-2 whitespace-pre-line text-sm leading-7 text-text-secondary">{{ block.body }}</p>
            </div>
          </section>

          <section v-else-if="block.type === 'faq'" class="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <h2 v-if="block.title" class="mb-3 text-lg font-semibold text-text-primary">{{ block.title }}</h2>
            <div v-if="block.items.length" class="divide-y divide-border">
              <details v-for="(item, itemIndex) in block.items" :key="`${item.title}-${itemIndex}`" class="py-3">
                <summary class="cursor-pointer list-none font-medium text-text-primary">{{ item.title }}</summary>
                <p class="mt-3 whitespace-pre-line text-sm leading-7 text-text-secondary">{{ item.body }}</p>
              </details>
            </div>
            <p v-else class="text-sm text-text-muted">پرسش و پاسخی برای این بخش ثبت نشده است.</p>
          </section>

          <section v-else-if="block.type === 'table'" class="overflow-hidden rounded-2xl border border-border bg-surface">
            <h2 v-if="block.title" class="border-b border-border px-4 py-3 text-lg font-semibold text-text-primary">{{ block.title }}</h2>
            <div v-if="block.items.length" class="overflow-x-auto">
              <table class="w-full min-w-96 text-right text-sm">
                <tbody class="divide-y divide-border">
                  <tr v-for="(item, itemIndex) in block.items" :key="`${item.title}-${itemIndex}`">
                    <th scope="row" class="w-1/3 bg-surface-hover px-4 py-3 font-medium text-text-primary">{{ item.title }}</th>
                    <td class="whitespace-pre-line px-4 py-3 leading-7 text-text-secondary">{{ item.body }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="px-4 py-3 text-sm text-text-muted">جدولی برای این بخش ثبت نشده است.</p>
          </section>
        </div>
      </template>

      <div v-if="activeTab === 'comments'" id="product-comments-panel" role="tabpanel" aria-labelledby="product-comments-tab">
        <CommentList target-type="product" :target-id="product.id" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.product-video:fullscreen,
.product-video:-webkit-full-screen {
  background: #000;
  object-fit: contain;
}
</style>
