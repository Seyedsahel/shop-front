export default defineEventHandler(async (event): Promise<SessionResponse> => {
  setHeader(event, 'Cache-Control', 'no-store')
  const credential = resolveCredential(event)
  if (credential) {
    const session = await readSession(event)
    if (session.isAuthenticated || session.hasGuestSession) return session
    // Do not silently turn an expired authenticated session into a guest.
    if (credential.kind === 'user') {
      throw createError({ statusCode: 401, message: 'Session expired', data: { code: 'AUTH_SESSION_EXPIRED' } })
    }
  }

  const response = await backendFetch<BackendGuestResponse>('/auth/guest', {
    method: 'POST', authorization: 'none', retry: 0,
  }, event)
  if (!response.token?.trim()) throw createError({ statusCode: 502, message: 'Invalid guest session response' })
  setCookie(event, 'guest_token', response.token, sessionCookieOptions)
  return { identity: sessionIdentity(response.token), isAuthenticated: false, hasGuestSession: true }
})
