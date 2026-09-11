// reusable later for comment pagination, blog list pagination, anything with the same "load more at the bottom" shape.
export function useInfiniteScroll(
  target: Ref<HTMLElement | null | undefined>,
  callback: () => void,
  options?: { rootMargin?: string }
) {
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    if (!import.meta.client || !target.value) return
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) callback()
      },
      { rootMargin: options?.rootMargin ?? '300px' } // fires slightly before the sentinel is actually visible
    )
    observer.observe(target.value)
  })

  onBeforeUnmount(() => observer?.disconnect())
}