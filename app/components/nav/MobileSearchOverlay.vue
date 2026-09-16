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
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200" enter-from-class="opacity-0"
      leave-active-class="transition duration-150" leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-100 bg-surface flex flex-col">
        <div class="flex items-center gap-3 px-4 h-16 border-b border-divider">
          <UiSearchBar
            v-model="query"
            autofocus
            :navigate-on-submit="false"
            class="flex-1"
            @submit="navigateTo(`/products?search=${encodeURIComponent($event)}`); close()"
          />
          <button class="text-text-secondary shrink-0" @click="close">
            <UIcon name="solar:close-circle-broken" class="size-6" />
          </button>
        </div>
        <ProductSearchResultsPanel :query="query" mode="mobile" @close="close" />
      </div>
    </Transition>
  </Teleport>
</template>
