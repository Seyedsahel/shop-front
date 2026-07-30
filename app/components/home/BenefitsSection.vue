<script setup lang="ts">
const benefits = [
  { label: "گارانتی 3 گانه محصولات", des:"اصالت، انقضا، کالای سالم ", icon: "solar:shield-check-outline" },
  { label:" 20 روز ضمانت مرجوعی", des:" حتی سلیقه‌ای  ", icon: "solar:refresh-outline" },
  { label: " مشاوره تخصصی رایگان", des:" هفت روز هفته تا ساعت 24  ", icon: "solar:hand-heart-line-duotone" },
  { label: " پرداخت ایمن", des:" از طریق درگاه‌های معتبر  ", icon: "solar:card-transfer-line-duotone" },
  
];

</script>

<template>
  <section class="max-w-dvw mx-auto px-4 sm:px-6 lg:px-16 py-10 border border-divider bg-surface rounded-2xl">
    <div class="flex justify-center items-center mb-7">
        <h2 class="text-lg sm:text-xl font-semibold text-accent-foreground text-end">
          چرا مارا انتخاب کنید؟
        </h2>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
    
      <div v-for="item in benefits" class="flex items-center border border-accent bg-secondary-active text-text-on-dark transition-transform duration-300 hover:scale-105 rounded-2xl py-6 px-8 gap-4">
          <UIcon :name="item.icon" class="sm:size-12 size-7" />
        <div class="gap-1 flex flex-col justify-center">
            <span class="text-lg">{{ item.label }}</span>
            <span class="text-sm">{{ item.des }}</span>
        </div>

      </div>
    </div>
  </section>
</template>