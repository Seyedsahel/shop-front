// app/composables/useToast.ts
import { toast } from 'vue-sonner'

// Thin wrapper so store code depends on one composable name,
// not on vue-sonner directly — swapping toast libraries again later
// means editing only this file.
export const useAppToast = () => ({
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
})