<script setup lang="ts"></script>

<template>
    <section class="relative isolate flex max-w-7xl rounded-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 items-center justify-center overflow-hidden">
    <!-- Background -->
    <img
      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqWrGyimZ-KetAjyPnvwctwHka45lyLjufzZWLZ_QJ7jwXM1D70foIlTE&s=10"
      alt="Hero Background"
      class="absolute inset-0 h-full w-full object-cover"
    >

    <!-- Overlay -->
    <div class="absolute inset-0 bg-accent-foreground/40 backdrop-blur-[2px]" />

    
    <!-- Content -->
    <div class="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-6 text-center">
        
        <div class="flex flex-col items-center justify-center">
            <UIcon name="solar:hand-heart-line-duotone" class="size-8 text-primary-foreground" />
            <span class="text-sm sm:text-md text-primary-subtle/90">در کنار شماییم</span>
        </div>

      <h1 class="mt-8 text-3xl md:text-6xl font-extrabold leading-tight text-primary-foreground">
        نیاز به راهنمایی دارید؟
        <br>
       مشاوره بگیرید.
      </h1>

      <p class="mt-5 max-w-xl text-base leading-8 text-primary-subtle md:text-lg">
       توضیحات اختصاصی بسته به نیاز و مشکل شما توسط افراد متخصص.
      </p>

      <NuxtLink
        to="/"
        class="mt-10 rounded-full bg-primary px-6 py-3 sm:px-10 sm:py-3 sm:text-lg font-semibold text-primary-foreground transition hover:scale-105 hover:shadow-xl"
      >
       مشاوره
      </NuxtLink>

    </div>
  </section>
</template>