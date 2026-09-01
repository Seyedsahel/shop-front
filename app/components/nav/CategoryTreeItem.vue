<script setup lang="ts">
defineProps<{ node: CategoryTreeNode; depth?: number }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <!-- Has children at any depth: accordion, recurse into itself -->
  <UiAccordion v-if="node.children.length" :title="node.name">
    <div :style="{ paddingInlineStart: `${((depth ?? 0) + 1) * 2}px` }">
      <NavCategoryTreeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="(depth ?? 0) + 1"
        @close="emit('close')"
      />
    </div>
  </UiAccordion>

  <!-- Leaf node: plain link -->
  <NuxtLink
    v-else
    :to="`/products?category=${node.slug}`"
    class="flex items-center justify-between px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
    @click="emit('close')"
  >
    {{ node.name }}
    <UIcon name="solar:alt-arrow-left-linear" class="size-4 text-text-muted" />
  </NuxtLink>
</template>