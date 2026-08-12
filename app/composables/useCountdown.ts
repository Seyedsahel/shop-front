export function useCountdown(targetIso: Ref<string | null>) {
  const remaining = reactive({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false })
  let timer: ReturnType<typeof setInterval> | undefined

  function tick() {
    if (!targetIso.value) return
    const diff = new Date(targetIso.value).getTime() - Date.now()
    if (diff <= 0) {
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

  watch(targetIso, (val) => {
    if (timer) clearInterval(timer)
    if (!val) return
    tick()
    timer = setInterval(tick, 1000)
  }, { immediate: true })

  onBeforeUnmount(() => timer && clearInterval(timer))

  return remaining
}