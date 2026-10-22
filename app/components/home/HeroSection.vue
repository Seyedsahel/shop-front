
<script setup lang="ts">
const bannerStore = useBannerStore()
const skincareImage = {
  src: '/images/hero/skin.jpeg',
  alt: 'محصولات مراقبت از پوست',
  href: '/products',
}
const supplementsImage = {
  src: '/images/hero/pills.jpeg',
  alt: 'مکمل‌های غذایی',
  href: '/products',
}
const fallbackImages = [skincareImage, supplementsImage, skincareImage, supplementsImage, skincareImage, supplementsImage, skincareImage]
const heroImages = computed(() => bannerStore.homeHero.length
  ? bannerStore.homeHero.map(banner => ({ src: banner.imageUrl, alt: banner.title, href: banner.href }))
  : fallbackImages)
const bottomHeroImages = computed(() => [6, 2].flatMap(index => {
  const image = heroImages.value[index]
  return image ? [image] : []
}))
</script>

<template>
  <section class=" bg-surface flex max-h-[75vh] items-center justify-between gap-5 overflow-hidden mb-10">
    <div class="flex w-2/5 flex-col gap-6 lg:gap-8 mx-7 lg:mx-14">
      <div class="flex flex-col gap-4">
        <span class="font-extrabold text-4xl lg:text-6xl text-danger-subtle">
         حامی دارو،
        </span>
        <span class="font-extrabold text-2xl lg:text-5xl text-primary">
حامی سلامتی شما        </span>
        </div>
      <div class="font-light text-sm lg:text-lg text-accent">با نسخه آنلاین <span class="font-bold">داروخانه شبانه روزی دکتر سالاری</span>، سریع‌تر و ساده‌تر به محصولات و خدمات موردنیاز خود دسترسی داشته باشید.</div>
      <div class="flex flex-col sm:flex-row gap-4 text-center text-sm sm:text-base ">
        <NuxtLink class="min-w-28 lg:w-50 px-1.5 py-2 rounded-xl  bg-primary text-primary-foreground hover:bg-primary-hover" 
        to="/products">
          مشاهده محصولات
        </NuxtLink>
      </div>
    </div>
    <!-- pictures -->
<div class="relative m-7 flex w-3/5 min-h-[75vh] items-center gap-4 ">

  <!-- Background decorative circles -->
   <div
    class="absolute top-20 left-60 h-70 w-70 rounded-full bg-secondary/20"
  ></div>
  <div
    class="absolute -bottom-6 left-10 h-70 w-70 rounded-full bg-danger-subtle/10"
  ></div>

  <div
    class="absolute -right-10 top-10 h-64 w-64 rounded-full bg-primary/10"
  ></div>

  <div
    class="absolute bottom-0 right-1/3 h-52 w-52 rounded-full bg-accent/20"
  ></div>


  <!-- Horizontal capsules, with upright capsules entering from below. -->
  <div class="absolute inset-y-0 right-0 z-10 hidden w-[66%] lg:block">
    <a
      v-if="heroImages[1]"
      :href="heroImages[1].href"
      class="absolute -top-[30%] right-0 h-[53%] w-full overflow-hidden rounded-full"
    >
      <img
        :src="heroImages[1].src"
        :alt="heroImages[1].alt"
        class="h-full w-full object-cover"
      />
    </a>
    <a
      v-if="heroImages[0]"
      :href="heroImages[0].href"
      class="absolute top-[25%] right-0 h-[55%] w-full overflow-hidden rounded-full"
    >
      <img
        :src="heroImages[0].src"
        :alt="heroImages[0].alt"
        class="h-full w-full object-cover"
      />
    </a>
    <div class="absolute top-[82%] right-0 grid h-[58%] w-full grid-cols-2 gap-5">
      <a
        v-for="(image, index) in bottomHeroImages"
        :key="index"
        :href="image.href"
        class="overflow-hidden rounded-full"
      >
        <img
          :src="image.src"
          :alt="image.alt"
          class="h-full w-full object-cover"
        />
      </a>
    </div>
  </div>


  <!-- Left picture -->
   <div class="relative z-10 flex flex-col gap-4 sm:mx-6 lg:absolute lg:left-0 lg:mx-0 lg:w-[28%]">

    <a
      v-if="heroImages[3]"
      :href="heroImages[3].href"
      class="h-45 w-62.5 overflow-hidden rounded-b-full lg:w-full"
    >
      <img
        :src="heroImages[3].src"
        :alt="heroImages[3].alt"
        class="h-full w-full object-cover"
      />
    </a>
    <a
      v-if="heroImages[4]"
      :href="heroImages[4].href"
    class="relative z-10 h-60 w-45 sm:h-95 sm:w-62.5 overflow-hidden rounded-full lg:w-full"
  >
    <img
      :src="heroImages[4].src"
      :alt="heroImages[4].alt"
      class="h-full w-full object-cover"
    />
  </a>

    <a
      v-if="heroImages[5]"
      :href="heroImages[5].href"
      class="h-50 w-62.5 overflow-hidden rounded-t-full lg:w-full"
    >
      <img
        :src="heroImages[5].src"
        :alt="heroImages[5].alt"
        class="h-full w-full object-cover"
      />
    </a>

  </div>
  

</div>


    </section>
</template>
