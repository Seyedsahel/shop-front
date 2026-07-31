<script setup lang="ts">
const consultationStore = useConsultationStore()
onMounted(() => consultationStore.fetchNotice())
</script>

<template>
  <div class="rounded-2xl border border-border-strong bg-surface p-6">
    <h2 class="text-sm font-semibold text-text-primary mb-4">نکاتی که پیش از ثبت درخواست باید بدانید</h2>
    <ul class="flex flex-col gap-2">
      <li v-for="(item, i) in consultationStore.notice" :key="i" class="flex items-start gap-2 text-sm text-text-secondary">
        <UIcon name="solar:check-circle-broken" class="size-4 shrink-0 mt-0.5 text-accent-foreground" />
        <span>{{ item }}</span>
      </li>
    </ul>
  </div>
</template>