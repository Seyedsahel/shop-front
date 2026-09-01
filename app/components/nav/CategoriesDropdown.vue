<script setup lang="ts">
const categoryStore = useCategoryStore()
onMounted(() => categoryStore.fetchCategories())
const emit = defineEmits<{ close: [] }>() 
const tree = computed(()=> buildCategoryTree(categoryStore.items))
</script>

<template>
  <div class="flex flex-col">
    <template v-if="categoryStore.isLoading">
      <div v-for="n in 6" :key="n" class="h-10 mx-2 my-1 rounded-lg bg-loading animate-pulse" />
    </template>
     <NavCategoryTreeItem
     class="px-4"
      v-else
      v-for="root in tree"
      :key="root.id"
      :node="root"
      @close="emit('close')"
    />

  </div>
</template>