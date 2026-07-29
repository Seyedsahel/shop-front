<script setup lang="ts">
const brandStore = useBrandStore()
onMounted(() => brandStore.fetchBrands())

const track = ref<HTMLElement>()
function scrollByCard(direction: 1 | -1) {
  track.value?.scrollBy({ left: direction * 160, behavior: 'smooth' })
}
</script>

<template>
  <section class="max-w-dvw mx-auto px-4 sm:px-6 lg:px-16 py-10">
    
        <div class="flex justify-center items-center mb-7">
            <h2 class="text-lg sm:text-xl font-semibold text-text-primary">
            محبوب‌ترین برندها
            </h2>
        </div>

        <div class="flex items-center justify-center gap-3.5">

            <button
                class="sm:p-2 hidden sm:flex size-8 items-center justify-center rounded-full border border-border-strong text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                @click="scrollByCard(1)"
                >
                <UIcon name="solar:arrow-right-broken" class="size-4" />
            </button>
             <div
      ref="track"
      class="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none"
    >
      <template v-if="brandStore.isLoading">
        <div v-for="n in 8" :key="n" class="w-28 h-20 shrink-0 rounded-xl bg-surface-hover animate-pulse" />
      </template>

      <NuxtLink
        v-else
        v-for="brand in brandStore.items"
        :key="brand.id"
        :to="brand.href ?? '#'"
        class="w-22 sm:w-32 shrink-0 snap-start flex flex-col items-center justify-center gap-1 rounded-xl border border-border-strong bg-surface hover:border-accent transition-colors"
      >
        <img :src="brand.logoUrl" :alt="brand.name" class="p-1 overflow-hidden" />
      </NuxtLink>
    </div>
      <button
          class="sm:p-2 hidden sm:flex size-8  items-center justify-center rounded-full border border-border-strong text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          @click="scrollByCard(-1)"
        >
          <UIcon name="solar:arrow-left-broken" class="size-4" />
        </button>
        </div>
   
  </section>
</template>