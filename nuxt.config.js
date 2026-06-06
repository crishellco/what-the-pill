export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'What The Pill',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Identify pills by photo, imprint code, or description. Check drug interactions.' }
      ]
    }
  },
  runtimeConfig: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    public: {}
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
