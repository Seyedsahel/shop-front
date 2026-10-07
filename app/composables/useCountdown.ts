export function useCountdown(targetIso: Ref<string | null>) {
  const remaining = reactive({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false })
  let timer: ReturnType<typeof setInterval> | undefined
  let mounted = false

  function tick() {
    if (!targetIso.value) return
    const diff = new Date(targetIso.value).getTime() - Date.now()
    if (!Number.isFinite(diff) || diff <= 0) {
      remaining.days = remaining.hours = remaining.minutes = remaining.seconds = 0
      remaining.expired = true
      if (timer) clearInterval(timer)
      return
    }
    remaining.days = Math.floor(diff / 86400000)
    remaining.hours = Math.floor((diff % 86400000) / 3600000)
    remaining.minutes = Math.floor((diff % 3600000) / 60000)
    remaining.seconds = Math.floor((diff % 60000) / 1000)
  }

  onMounted(() => { mounted = true; tick(); if (targetIso.value && !remaining.expired) timer = setInterval(tick, 1000) })
  watch(targetIso, (val) => {
    if (timer) clearInterval(timer)
    timer = undefined
    remaining.days = remaining.hours = remaining.minutes = remaining.seconds = 0
    remaining.expired = false
    if (!val) return
    remaining.expired = false
    if (mounted) { tick(); if (!remaining.expired) timer = setInterval(tick, 1000) }
  })

  onBeforeUnmount(() => timer && clearInterval(timer))

  return remaining
}
