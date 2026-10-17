
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
const fallbackImages = [skincareImage, supplementsImage, skincareImage, supplementsImage, skincareImage, supplementsImage]
const heroImages = computed(() => bannerStore.homeHero.length
  ? bannerStore.homeHero.map(banner => ({ src: banner.imageUrl, alt: banner.title, href: banner.href }))
  : fallbackImages)
</script>

<template>
  <section class=" bg-surface flex max-h-[75vh] items-center justify-between gap-5 overflow-hidden">
    <div class="flex w-2/5 flex-col gap-6 lg:gap-8 mx-7 lg:mx-14">
      <div class="flex flex-col gap-4">
        <span class="font-extrabold text-4xl lg:text-6xl text-danger-subtle">
          سلامت و زیبایی شما
        </span>
        <span class="font-extrabold text-2xl lg:text-5xl text-primary">
          در دستان ماست
        </span>
        </div>
      <div class="font-light text-sm lg:text-lg text-accent">به دنبال محصولاتی با کیفیت از دل طبیعت هستید؟ ما در تلاشیم آنهارا به دست شما برسانیم</div>
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


  <!-- Main picture -->
  <a
    v-if="heroImages[0]"
    :href="heroImages[0].href"
    class="hidden lg:block relative z-10 h-150 w-70 shrink-0 overflow-hidden rounded-full"
  >
    <img
      :src="heroImages[0].src"
      :alt="heroImages[0].alt"
      class="h-full w-full object-cover"
    />
  </a>


  <!-- Middle pictures -->
  <div class="hidden lg:flex relative z-10 flex-col gap-8 mx-6">

    <a
      v-for="(image, index) in heroImages.slice(1, 3)"
      :key="index"
      :href="image.href"
      class="h-70 w-62.5 overflow-hidden rounded-full"
    >
      <img
        :src="image.src"
        :alt="image.alt"
        class="h-full w-full object-cover"
      />
    </a>

  </div>


  <!-- Left picture -->
   <div class="relative z-10 flex flex-col gap-4 sm:mx-6">

    <a
      v-if="heroImages[3]"
      :href="heroImages[3].href"
      class="h-45 w-62.5 overflow-hidden rounded-b-full"
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
    class="relative z-10 h-60 w-45 sm:h-95 sm:w-62.5 overflow-hidden rounded-full"
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
      class="h-50 w-62.5 overflow-hidden rounded-t-full"
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
