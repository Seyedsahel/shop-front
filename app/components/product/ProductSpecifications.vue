<script setup lang="ts">
defineProps<{ specifications: ProductSpecification[] }>()

function displayValue(specification: ProductSpecification) {
  if (specification.dataType === 'boolean') return specification.value === 'true' ? 'بله' : 'خیر'
  return [specification.value, specification.unit].filter(Boolean).join(' ')
}
</script>

<template>
  <section class="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div class="mb-5 flex items-center gap-2"><UIcon name="solar:clipboard-text-outline" class="size-5 text-primary" /><h2 class="text-lg font-semibold text-text-primary">مشخصات محصول</h2></div>
    <dl v-if="specifications.length" class="grid overflow-hidden rounded-xl border border-accent sm:grid-cols-2">
      <div v-for="specification in specifications" :key="specification.attributeId" class="flex min-h-18 flex-col justify-center gap-1 border-b border-accent bg-accent-subtle/50 p-4 last:border-b-0 sm:nth-[n+3]:border-b-0 sm:odd:border-e">
        <dt class="text-xs text-text-secondary">{{ specification.name }}</dt>
        <dd class="text-sm font-medium text-text-primary">{{ displayValue(specification) || '—' }}</dd>
      </div>
    </dl>
    <p v-else class="rounded-xl bg-surface p-4 text-sm text-text-muted">مشخصاتی برای این محصول ثبت نشده است.</p>
  </section>
</template>
