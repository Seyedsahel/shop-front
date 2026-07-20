<script setup lang="ts">
</script>

<template>
  <section class="relative isolate flex min-h-[75vh] items-center justify-center overflow-hidden">
    <!-- Background -->
    <img
      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqWrGyimZ-KetAjyPnvwctwHka45lyLjufzZWLZ_QJ7jwXM1D70foIlTE&s=10"
      alt="Hero Background"
      class="absolute inset-0 h-full w-full object-cover"
    >

    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />

    <!-- Content -->
    <div class="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-6 text-center">

      <UiSearchBar />

      <h1 class="mt-8 text-4xl font-extrabold leading-tight text-text-on-dark md:text-6xl">
       سلامتی شما،
        <br>
        از مراقبت درست شروع می‌شود
      </h1>

      <p class="mt-5 max-w-xl text-base leading-8 text-text-on-dark/80 md:text-lg">
        خرید محصولات تخصصی مراقبت از پوست، مو و مکمل ها و رزرو 
        مشاوره تخصصی، همه در یک مکان.
      </p>

      <NuxtLink
        to="/"
        class="mt-10 rounded-full bg-secondary px-6 py-3 sm:px-10 sm:py-3 sm:text-lg font-semibold text-text-on-dark transition hover:scale-105 hover:shadow-xl"
      >
        مشاهده محصولات
      </NuxtLink>

    </div>
  </section>
</template>