<script setup lang="ts">
const props = defineProps<{ product: ProductDetail }>()
const activeTab = ref(props.product.descriptionBlocks.length ? 'block-0' : 'comments')

const tabs = computed(() => [
  ...props.product.descriptionBlocks.map((block, index) => ({ id: `block-${index}`, label: block.title })),
  { id: 'comments', label: 'نظرات کاربران' },
])

watch(() => props.product.descriptionBlocks.length, () => {
  if (!tabs.value.some(tab => tab.id === activeTab.value)) {
    activeTab.value = props.product.descriptionBlocks.length ? 'block-0' : 'comments'
  }
})
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-border bg-card">
    <div class="flex gap-1 overflow-x-auto border-b border-divider bg-surface p-2" role="tablist" aria-label="اطلاعات تکمیلی محصول">
      <button
        v-for="tab in tabs"
        :id="`product-${tab.id}-tab`"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-controls="`product-${tab.id}-panel`"
        :aria-selected="activeTab === tab.id"
        class="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
        :class="activeTab === tab.id ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:bg-card hover:text-text-primary'"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="p-5 sm:p-6">
      <template v-for="(block, index) in product.descriptionBlocks" :key="index">
        <div v-if="activeTab === `block-${index}`" :id="`product-block-${index}-panel`" role="tabpanel" :aria-labelledby="`product-block-${index}-tab`">
          <h2 class="text-xl font-semibold text-text-primary">{{ block.title }}</h2>
          <p class="mt-3 whitespace-pre-line text-sm leading-8 text-text-secondary sm:text-base">{{ block.body }}</p>
        </div>
      </template>

      <div v-if="activeTab === 'comments'" id="product-comments-panel" role="tabpanel" aria-labelledby="product-comments-tab">
        <CommentList target-type="product" :target-id="product.id" />
      </div>
    </div>
  </section>
</template>
