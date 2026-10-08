import type { H3Event } from 'h3'
import { backendFetch } from './backendFetch'
import { clearCredential, resolveCredential } from './session'

export async function readSession(event: H3Event): Promise<SessionResponse> {
  const credential = resolveCredential(event)
  if (!credential) return { identity: null, scope: null, isAuthenticated: false, hasGuestSession: false }

  try {
    const validation = await backendFetch<BackendAuthValidateResponse>('/auth/validate', {}, event)
    const expectedRole = credential.kind === 'guest' ? 'guest' : 'user'
    if (!validation.valid || validation.role !== expectedRole) {
      clearCredential(event, credential.kind)
      return { identity: null, scope: null, isAuthenticated: false, hasGuestSession: false }
    }
    if (credential.kind === 'user' && (typeof validation.id !== 'string' || !validation.id.trim())) {
      throw createError({ statusCode: 502, message: 'Invalid authentication validation response from backend' })
    }
    return {
      identity: sessionIdentity(credential.token),
      // A rotated token for the same user must retain the same resource scope.
      scope: credential.kind === 'user' ? sessionIdentity(`user:${validation.id}`) : sessionIdentity(credential.token),
      isAuthenticated: credential.kind === 'user',
      hasGuestSession: credential.kind === 'guest',
      ...(credential.kind === 'user' ? { user: { id: validation.id, role: validation.role } } : {}),
    }
  } catch (error: any) {
    if ([401, 403].includes(error.statusCode ?? error.response?.status)) {
      clearCredential(event, credential.kind)
      return { identity: null, scope: null, isAuthenticated: false, hasGuestSession: false }
    }
    throw error
  }
}
