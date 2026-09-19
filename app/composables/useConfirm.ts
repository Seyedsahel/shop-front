export interface ConfirmOptions {
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
}

interface ConfirmState {
  open: boolean
  message: string
  options: Required<ConfirmOptions>
  resolve: ((confirmed: boolean) => void) | null
}

const defaultOptions: Required<ConfirmOptions> = {
  title: 'تأیید عملیات',
  confirmLabel: 'تأیید',
  cancelLabel: 'انصراف',
  variant: 'primary',
}

export function useConfirmState() {
  return useState<ConfirmState>('ui-confirm-dialog', () => ({
    open: false,
    message: '',
    options: defaultOptions,
    resolve: null,
  }))
}

/** Shared confirmation boundary; invoked only from explicit client-side actions. */
export function useConfirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
  if (import.meta.server) return Promise.resolve(false)
  const state = useConfirmState()
  if (state.value.open) return Promise.resolve(false)

  return new Promise((resolve) => {
    state.value = {
      open: true,
      message,
      options: { ...defaultOptions, ...options },
      resolve,
    }
  })
}

export function resolveConfirm(confirmed: boolean) {
  const state = useConfirmState()
  const resolve = state.value.resolve
  state.value = {
    open: false,
    message: '',
    options: defaultOptions,
    resolve: null,
  }
  resolve?.(confirmed)
}
