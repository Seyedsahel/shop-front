// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: [
    '@/assets/css/main.css'
  ],
  vite: {
    plugins: [
      tailwindcss()
    ]
  },
  modules: [
    '@pinia/nuxt',
    '@nuxt/ui',
  ],
  app: {
    head: {
      title: 'Shop Front',
      link: [
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css' }
      ]
    }
  },
  runtimeConfig: {
    backendUrl: '',
    backendApiKey: '',
  }
})
