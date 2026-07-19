<script setup lang="ts">
const searchQuery = ref('')
</script>
<template>
     <div class="w-full pt-6 sm:px-6 lg:px-8">
        <div class="w-full">
          <div class="flex items-center gap-2 rounded-full bg-white/30 backdrop-blur-md border border-accent/30 px-4 py-2.5 shadow-md">
            <UIcon name="solar:magnifer-linear" class="size-5 text-text-secondary shrink-0" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="جستجوی محصولات و خدمات..."
              class="w-full bg-transparent outline-none text-sm text-text-on-primary placeholder:text-text-secondary"
            />
          </div>
        </div>
      </div>
</template>