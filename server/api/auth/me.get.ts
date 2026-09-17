export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const token = getCookie(event, 'auth_token')
  if (!token) return { isAuthenticated: false }

  // TODO(auth): Replace this cookie-presence check with backend token validation
  // once the backend provides /auth/me. Do not derive a user profile from the JWT
  // on the client or server before then.
  return {isAuthenticated: true}
})
