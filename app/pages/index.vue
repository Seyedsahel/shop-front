<script setup lang="ts">
const bannerStore = useBannerStore()
const stories = useStoryStore()
const categories = useCategoryStore()
const brands = useBrandStore()
const products = useProductListStore()
const offer = useOfferStore()
const blog = useBlogStore()
const shop = useShopStore()
const featuredCategory = '0fa5f2d7-8a16-5a5c-85eb-79922cf7c399'
const sections = [
  { name: 'بنرها', error: () => bannerStore.error, load: () => bannerStore.fetchBanners() },
  { name: 'استوری‌ها', error: () => stories.error?.message, load: () => stories.fetchStories() },
  { name: 'دسته‌بندی‌ها', error: () => categories.error, load: () => categories.fetchCategories() },
  { name: 'برندها', error: () => brands.error, load: () => brands.fetchBrands() },
  { name: 'محصولات ویژه', error: () => products.previewError[featuredCategory], load: () => products.fetchPreview(featuredCategory, true) },
  { name: 'مقالات', error: () => blog.error?.message, load: () => blog.fetchPosts() },
  { name: 'تخفیف‌ها', error: () => products.availabilityError, load: () => products.fetchDiscountedAvailability() },
]
await callOnce('home:sections', () => Promise.allSettled([
  bannerStore.fetchBanners(), stories.fetchStories(), categories.fetchCategories(), brands.fetchBrands(),
  products.fetchDiscountedAvailability(), offer.fetchOffer(), callOnce(`preview:${featuredCategory}`, () => products.fetchPreview(featuredCategory), { mode: 'navigation' }), blog.fetchPosts(),
]).then(() => {}), { mode: 'navigation' })
usePageSeo(() => shop.name, () => shop.info?.description || 'محصولات، پیشنهادهای ویژه و تازه‌ترین مقالات فروشگاه.')
</script>

<template>
  <div v-for="section in sections.filter(section => section.error())" :key="section.name" role="alert" class="mx-auto max-w-7xl p-4 text-danger">
    {{ section.name }}: {{ section.error() }} <button type="button" class="underline" @click="section.load()">تلاش دوباره</button>
  </div>
  <StoriesBar />
  <HomeHeroSection />
  <BannerSlider />
  <OfferSpecialOfferSlider />
  <CategoryGrid />
  <BannerDuoBanner />
  <ProductSlider :category-id="featuredCategory" title="محصولات ویژه" variant="compact" />
  <BrandSlider />
  <HomeConsultationSection :background-image-url="bannerStore.homeHero[0]?.imageUrl" />
  <BlogGrid />
  <HomeBenefitsSection />
</template>
