<script setup lang="ts">
const open = defineModel<boolean>({ required: true })
const query = ref('')

function close() {
  open.value = false
}

watch(open, value => {
  if (!value) {
    query.value = ''
    useProductListStore().clearSearch()
  }
})
</script>

<template>
  <UiModal v-model="open" title="جستجوی محصولات" placement="fullscreen">
    <template #header="{ titleId }">
      <h2 :id="titleId" class="sr-only">جستجوی محصولات</h2>
      <div class="flex shrink-0 items-center gap-3 px-4 h-16 border-b border-divider">
        <UiSearchBar
          v-model="query"
          autofocus
          :navigate-on-submit="false"
          class="flex-1"
          @submit="navigateTo(`/products?search=${encodeURIComponent($event)}`); close()"
        />
        <button type="button" aria-label="بستن جستجو" class="text-text-secondary shrink-0 focus-visible:outline-2 focus-visible:outline-primary" @click="close">
          <UIcon name="solar:close-circle-broken" class="size-6" />
        </button>
      </div>
    </template>
    <ProductSearchResultsPanel
      :query="query"
      mode="mobile"
      @close="close"
      @select="query = ''; close()"
    />
  </UiModal>
</template>
