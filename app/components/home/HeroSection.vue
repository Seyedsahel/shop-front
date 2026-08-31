
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
        <NuxtLink class="min-w-28 lg:w-50 px-3.5 py-2 rounded-xl  bg-secondary text-secondary-foreground hover:bg-secondary-hover" 
        to="/consultation">
          دریافت مشاوره
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
  <div
    class="hidden lg:block relative z-10 h-150 w-70 shrink-0 overflow-hidden rounded-full"
  >
    <img
      src="https://matterofmonday.com/cdn/shop/files/Four_Product_Full_Size_4k.webp?v=1779483233"
      alt=""
      class="h-full w-full object-cover"
    />
  </div>


  <!-- Middle pictures -->
  <div class="hidden lg:flex relative z-10 flex-col gap-8 mx-6">

    <div
      class="h-70 w-62.5 overflow-hidden rounded-full"
    >
      <img
        src="https://www.beautypackaging.com/wp-content/uploads/sites/8/2025/03/871_main-3.jpg"
        alt=""
        class="h-full w-full object-cover"
      />
    </div>

    <div
      class="h-70 w-62.5 overflow-hidden rounded-full"
    >
      <img
        src="https://cdn.shopify.com/s/files/1/0513/2409/files/minimalskincare.jpg?v=1695229112"
        alt=""
        class="h-full w-full object-cover"
      />
    </div>

  </div>


  <!-- Left picture -->
   <div class="relative z-10 flex flex-col gap-4 sm:mx-6">

    <div
      class="h-45 w-62.5 overflow-hidden rounded-b-full"
    >
      <img
        src="https://www.beautypackaging.com/wp-content/uploads/sites/8/2025/03/871_main-3.jpg"
        alt=""
        class="h-full w-full object-cover"
      />
    </div>
    <div
    class="relative z-10 h-60 w-45 sm:h-95 sm:w-62.5 overflow-hidden rounded-full"
  >
    <img
      src="https://cdn.sanity.io/images/513whq4h/production/b57a528049124b9407b4a9dcaf26d415536a0320-2048x2048.jpg?auto=format&fit=max&q=75&w=1024"
      alt=""
      class="h-full w-full object-cover"
    />
  </div>

    <div
      class="h-50 w-62.5 overflow-hidden rounded-t-full"
    >
      <img
        src="https://cdn.shopify.com/s/files/1/0513/2409/files/minimalskincare.jpg?v=1695229112"
        alt=""
        class="h-full w-full object-cover"
      />
    </div>

  </div>
  

</div>


    </section>
</template>