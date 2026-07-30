<script setup lang="ts">
import StoriesBar from '~/components/stories/StoriesBar.vue';
import ProductGrid from '~/components/product/ProductGrid.vue';
import ConsultationSection from '~/components/home/ConsultationSection.vue';
import BenefitsSection from '~/components/home/BenefitsSection.vue';


</script>

<template>
    <StoriesBar/>
    <HomeHeroSection />
    <div class="m-10">

        <ProductGrid category="home-product" title="محصولات ویژه" variant="compact" />
        <ProductSlider category="home-product" title="محصولات ویژه" variant="compact"  />
        <BrandSlider />
        <CategoryGrid />
        <BannerSlider />
        <BannerDuoBanner />
        <ConsultationSection/>
        <BlogGrid/>
        <BenefitsSection/>

        <h1 class="text-3xl font-bold underline">
            Hello world!
        </h1>
    </div>
</template>