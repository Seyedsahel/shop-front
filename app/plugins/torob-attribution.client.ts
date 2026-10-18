export default defineNuxtPlugin({
  name: 'torob-attribution',
  enforce: 'pre',
  dependsOn: ['nuxt:router'],
  setup() {
    // Read the browser URL before auth initialization or route cleanup can redirect.
    captureTorobClick(window.location.search)
    let previousClick = new URLSearchParams(window.location.search).get('torob_clid')
    addRouteMiddleware('torob-attribution', to => {
      const search = new URL(to.fullPath, window.location.origin).search
      const click = new URLSearchParams(search).get('torob_clid')
      // Retaining the parameter during ordinary navigation must not renew expiry.
      if (click !== previousClick) captureTorobClick(search)
      previousClick = click
    }, { global: true })
  },
})
