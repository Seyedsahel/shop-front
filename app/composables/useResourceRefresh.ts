/** Per-store read queue. Freshness signals arriving mid-read require one trailing read. */
export function useResourceRefresh(run: () => Promise<void>, mutating?: Ref<boolean>) {
  let active: Promise<void> | null = null
  let queued: Promise<void> | null = null

  function waitForMutation(): Promise<void> {
    if (!mutating?.value) return Promise.resolve()
    return new Promise(resolve => {
      const stop = watch(mutating, busy => {
        if (!busy) { stop(); resolve() }
      }, { flush: 'sync' })
    })
  }

  function request(fresh = false): Promise<void> {
    if (queued) return queued
    if (active && !fresh) return active
    const previous = active
    let promise!: Promise<void>
    promise = (async () => {
      if (previous) await previous.catch(() => {})
      do { await waitForMutation() } while (mutating?.value)
      if (queued === promise) queued = null
      active = promise
      await run()
    })().finally(() => {
      if (active === promise) active = null
      if (queued === promise) queued = null
    })
    queued = promise
    return promise
  }

  return { request }
}
