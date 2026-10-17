<script setup lang="ts">
// Restore access only after completing docs/consultation-reactivation.md.
definePageMeta({
  middleware: () => abortNavigation(createError({ statusCode: 404, statusMessage: 'Page Not Found' })),
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <ConsultationNoticeBox />
    <ConsultationForm />
  </div>
</template>
