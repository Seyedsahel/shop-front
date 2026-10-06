/** Compose an explicit cancellation signal with a deadline, including fetch wrappers. */
export function createRequestDeadline(milliseconds: number, external?: AbortSignal | null) {
  const controller = new AbortController()
  let timedOut = false
  const cancel = () => controller.abort(external?.reason)
  if (external?.aborted) cancel()
  else external?.addEventListener('abort', cancel, { once: true })
  const timer = setTimeout(() => {
    if (controller.signal.aborted) return
    timedOut = true
    controller.abort(new DOMException('Request deadline exceeded', 'TimeoutError'))
  }, milliseconds)
  return {
    signal: controller.signal,
    get timedOut() { return timedOut },
    async wait<T>(work: Promise<T>): Promise<T> {
      let onAbort!: () => void
      const aborted = new Promise<never>((_, reject) => {
        onAbort = () => reject(controller.signal.reason ?? new DOMException('Request cancelled', 'AbortError'))
        if (controller.signal.aborted) onAbort()
        else controller.signal.addEventListener('abort', onAbort, { once: true })
      })
      // Nitro's in-process SSR fetch may not stop its handler on abort.
      // Bound the caller's wait too; late completion cannot return stale data.
      try { return await Promise.race([work, aborted]) }
      finally { controller.signal.removeEventListener('abort', onAbort) }
    },
    dispose() { clearTimeout(timer); external?.removeEventListener('abort', cancel) },
  }
}

export function resolveRequestTimeout(value: unknown, fallback: number): number {
  const milliseconds = Number(value)
  return Number.isSafeInteger(milliseconds) && milliseconds > 0 && milliseconds <= 2_147_483_647 ? milliseconds : fallback
}
