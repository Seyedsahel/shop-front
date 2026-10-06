<script setup lang="ts">
const bannerStore = useBannerStore()
onMounted(() => bannerStore.fetchBanners())
</script>

<template>
    <StoriesBar/>
    <HomeHeroSection />
    <BannerSlider />
    <OfferSpecialOfferSlider />
    <CategoryGrid />
    <BannerDuoBanner />
    <ProductSlider categoryId="0fa5f2d7-8a16-5a5c-85eb-79922cf7c399" title="محصولات ویژه" variant="compact" />
    <BrandSlider />
    <!-- <ProductGrid category="home-product" title="محصولات ویژه" variant="compact" /> -->
    <HomeConsultationSection :background-image-url="bannerStore.homeHero[0]?.imageUrl" />
    <BlogGrid/>
    <HomeBenefitsSection/>
</template>
