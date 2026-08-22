export function useClickOutside(target: Ref<HTMLElement | null | undefined>, callback: () => void) {
  function handler(e: MouseEvent) {
    if (target.value && !target.value.contains(e.target as Node)) {
      callback()
    }
  }

  onMounted(() => document.addEventListener('mousedown', handler))
  onBeforeUnmount(() => document.removeEventListener('mousedown', handler))
}