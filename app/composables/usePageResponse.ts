/** Capture the request context before awaited loaders; client retries do not set HTTP headers. */
export function usePageResponse() {
  const event = import.meta.server ? useRequestEvent() : undefined
  return (status: number) => { if (event) setResponseStatus(event, status) }
}
