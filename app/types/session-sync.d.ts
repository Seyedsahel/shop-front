import type { SessionResource } from '../../shared/types/auth.types'

declare module '#app' {
  interface RuntimeNuxtHooks {
    'session:invalidate': (resource: SessionResource) => void
  }
}

export {}
