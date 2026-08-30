<script setup lang="ts">
const props = defineProps<{ targetDate: string | null }>()
const targetRef = toRef(props, 'targetDate')
const time = useCountdown(targetRef)

const units = computed(() => [
  { label: 'ثانیه', value: time.seconds },
  { label: 'دقیقه', value: time.minutes },
  { label: 'ساعت', value: time.hours },
  { label: 'روز', value: time.days },
])
</script>

<template>
  <div class="flex items-center gap-2">
    <div v-for="unit in units" :key="unit.label" class="flex flex-col items-center gap-1 bg-timer-bg rounded-lg w-11 py-1.5">
      <span class="text-sm font-bold text-timer-text tabular-nums">{{ String(unit.value).padStart(2, '0') }}</span>
      <span class="text-[10px] text-timer-label">{{ unit.label }}</span>
    </div>
  </div>
</template>