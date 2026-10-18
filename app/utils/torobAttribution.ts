const torobCookieName = 'torob_clid'
const torobMaxAge = 7 * 24 * 60 * 60

/** Capture only arrivals, never reads: browsing must not extend attribution. */
export function captureTorobClick(search: string): void {
  const id = new URLSearchParams(search).get(torobCookieName)?.trim()
  if (!id || id.length > 200 || typeof document === 'undefined') return
  try {
    document.cookie = `${torobCookieName}=${encodeURIComponent(id)}; Max-Age=${torobMaxAge}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
  } catch {
    // Attribution storage being unavailable must not interrupt shopping.
  }
}

export function getTorobClick(): string {
  if (typeof document === 'undefined') return ''
  try {
    const cookie = document.cookie.split(';').map(value => value.trim())
      .find(value => value.startsWith(`${torobCookieName}=`))
    const id = cookie ? decodeURIComponent(cookie.slice(torobCookieName.length + 1)).trim() : ''
    return id.length <= 200 ? id : ''
  } catch {
    return ''
  }
}
