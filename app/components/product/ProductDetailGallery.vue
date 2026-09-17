<script setup lang="ts">
const props = defineProps<{ product: ProductDetail }>()

const failedImageUrls = ref(new Set<string>())
const images = computed(() =>
  [...props.product.images]
    .filter(image => image.imageUrl && !failedImageUrls.value.has(image.imageUrl))
    .sort((a, b) => Number(b.isThumbnail) - Number(a.isThumbnail) || a.sortOrder - b.sortOrder),
)
const selectedUrl = ref('')
const selectedImage = computed(() => images.value.find(image => image.imageUrl === selectedUrl.value) ?? images.value[0])

watch(
  () => props.product.id,
  () => { selectedUrl.value = images.value[0]?.imageUrl ?? '' },
  { immediate: true },
)

function markImageFailed(url: string) {
  failedImageUrls.value = new Set([...failedImageUrls.value, url])
}
</script>

<template>
  <section class="rounded-2xl border border-border bg-surface p-3 sm:p-5">
    <div class="flex flex-col-reverse gap-3 sm:flex-row">
      <div v-if="images.length > 1" class="flex gap-2 overflow-x-auto sm:w-20 sm:flex-col sm:overflow-y-auto">
        <button
          v-for="image in images"
          :key="image.imageUrl"
          type="button"
          class="size-16 shrink-0 overflow-hidden rounded-xl border bg-card transition-colors sm:size-18"
          :class="selectedImage?.imageUrl === image.imageUrl ? 'border-primary ring-2 ring-focus-ring' : 'border-border-strong hover:border-accent'"
          :aria-label="`نمایش تصویر محصول ${product.name}`"
          @click="selectedUrl = image.imageUrl"
        >
          <img :src="image.imageUrl" :alt="product.name" class="size-full object-cover" @error="markImageFailed(image.imageUrl)">
        </button>
      </div>

      <div class="relative flex aspect-square flex-1 items-center justify-center overflow-hidden rounded-xl bg-card">
        <img
          v-if="selectedImage"
          :src="selectedImage.imageUrl"
          :alt="product.name"
          class="size-full object-contain p-4 sm:p-8"
          @error="markImageFailed(selectedImage.imageUrl)"
        >
        <div v-else class="flex flex-col items-center gap-3 text-text-muted">
          <UIcon name="solar:gallery-remove-outline" class="size-12" />
          <span class="text-sm">تصویری برای این محصول ثبت نشده است.</span>
        </div>
      </div>
    </div>
  </section>
</template>
