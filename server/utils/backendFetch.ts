import type { H3Event } from 'h3'

export const backendFetch = <T = unknown>(url: string, opts: any = {}, event?: H3Event) => {
  const config = useRuntimeConfig()
  const authToken = event ? getCookie(event, 'auth_token') : undefined

  return $fetch<T>(url, {
    baseURL: config.backendUrl,
    ...opts,
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...opts.headers,
    },
  })
}
