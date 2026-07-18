export const backendFetch = <T = unknown>(url: string, opts: any = {}) => {
  const config = useRuntimeConfig()

  return $fetch<T>(url, {
    baseURL: config.backendUrl,
    ...opts,
    headers: {
      ...opts.headers,
    },
  })
}