<script setup lang="ts">
const bannerStore = useBannerStore()
const stories = useStoryStore()
const categories = useCategoryStore()
const brands = useBrandStore()
const products = useProductListStore()
const offer = useOfferStore()
const blog = useBlogStore()
const shop = useShopStore()
const featuredCategory = '8cf0153c-cc1a-541f-89d1-cfa702422eee'
const sections = {
  banners: { title: 'بنرها', error: () => bannerStore.error, load: () => bannerStore.fetchBanners() },
  stories: { title: 'استوری‌ها', error: () => stories.error?.message, load: () => stories.fetchStories(true) },
  categories: { title: 'دسته‌بندی‌ها', error: () => categories.error, load: () => categories.fetchCategories() },
  brands: { title: 'برندها', error: () => brands.error, load: () => brands.fetchBrands() },
  products: { title: 'محصولات ویژه', error: () => products.previewError[featuredCategory], load: () => products.fetchPreview(featuredCategory, true) },
  blog: { title: 'مقالات', error: () => blog.error?.message, load: () => blog.fetchPosts(true) },
  discounts: { title: 'تخفیف‌ها', error: () => products.availabilityError, load: () => products.fetchDiscountedAvailability() },
  offer: { title: 'پیشنهاد شگفت‌انگیز', error: () => offer.error, load: () => offer.fetchOffer(true) },
}
type SectionKey = keyof typeof sections
const unexpectedErrors = useState<Partial<Record<SectionKey, string>>>('home:section-errors', () => ({}))
const pending = ref<Partial<Record<SectionKey, boolean>>>({})
function sectionError(key: SectionKey) { return unexpectedErrors.value[key] || sections[key].error() }
async function loadSection(key: SectionKey) {
  if (pending.value[key]) return
  pending.value[key] = true
  unexpectedErrors.value[key] = ''
  try {
    await sections[key].load()
  } catch {
    unexpectedErrors.value[key] = 'دریافت این بخش موقتاً امکان‌پذیر نیست.'
  } finally {
    pending.value[key] = false
  }
}
function loadSections(keys: SectionKey[]) {
  return Promise.allSettled(keys.map(loadSection)).then(() => {})
}
const sectionKeys = Object.keys(sections) as SectionKey[]
if (import.meta.server) {
  // Preserve section content in the initial HTML and hydration payload.
  await callOnce('home:sections', () => loadSections(sectionKeys), { mode: 'navigation' })
} else {
  // Hero, top, and middle banners share one backend request.
  await callOnce('home:hero', () => loadSection('banners'), { mode: 'navigation' })
  // Start shared-store refreshes only once Home replaces the outgoing page.
  onMounted(() => {
    void callOnce('home:sections', () => loadSections(sectionKeys.filter(key => key !== 'banners')), { mode: 'navigation' })
  })
}
usePageSeo(() => shop.name, () => shop.info?.description || 'محصولات، پیشنهادهای ویژه و تازه‌ترین مقالات فروشگاه.')
</script>

<template>
  <UiOptionalSection :failed="!!sectionError('stories')">
    <StoriesBar />
  </UiOptionalSection>
  <HomeHeroSection />
  <UiOptionalSection :failed="!!sectionError('banners')">
    <BannerSlider />
  </UiOptionalSection>
  <UiOptionalSection :failed="!!sectionError('offer')">
    <OfferSpecialOfferSlider />
  </UiOptionalSection>
  <UiOptionalSection :failed="!!sectionError('categories')">
    <CategoryGrid />
  </UiOptionalSection>
  <UiOptionalSection>
    <BannerDuoBanner />
  </UiOptionalSection>
  <UiOptionalSection :failed="!!sectionError('products')">
    <ProductSlider :category-id="featuredCategory" title="محصولات ویژه" variant="compact" />
  </UiOptionalSection>
  <UiOptionalSection :failed="!!sectionError('brands')">
    <BrandSlider />
  </UiOptionalSection>
  <UiOptionalSection :failed="!!sectionError('blog')">
    <BlogGrid />
  </UiOptionalSection>
  <HomeBenefitsSection />
</template>
