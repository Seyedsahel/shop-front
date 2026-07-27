<script setup lang="ts">
import StoriesBar from '~/components/stories/StoriesBar.vue';
import ProductGrid from '~/components/product/ProductGrid.vue';


</script>

<template>
    <StoriesBar />
    <HomeHeroSection />
    <ProductGrid category="home-product" title="محصولات ویژه" variant="compact" />
    <ProductSlider category="home-product" title="محصولات ویژه" variant="compact"  />
    <h1 class="text-3xl font-bold underline">
        Hello world!
    </h1>
</template>