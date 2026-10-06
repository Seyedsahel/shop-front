<script setup lang="ts">
import ProductListPage from '~/components/product/ProductListPage.vue'
</script>

<template>
  <ProductListPage :collection="{ kind: 'catalog' }" />
</template>
