export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@nuxtjs/supabase"],
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "What The Pill",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Identify pills by photo, imprint code, or description. Check drug interactions.",
        },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      ],
    },
  },
  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY,
    redirect: true,
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      include: ["/cabinet", "/cabinet/*"],
      saveRedirectToCookie: true,
    },
  },
  runtimeConfig: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    public: {
      siteUrl:
        process.env.NUXT_PUBLIC_SITE_URL ||
        process.env.URL ||
        "http://localhost:3000",
    },
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: process.env.NODE_ENV !== "production" },
  nitro: {
    preset: "netlify",
  },
})
