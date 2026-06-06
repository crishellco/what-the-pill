export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@nuxtjs/supabase"],
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "What The Pill",
      htmlAttrs: { lang: "en" },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Identify pills by photo, imprint code, or description. Check drug interactions and save your personal pill cabinet.",
        },
        { name: "theme-color", content: "#0F172A" },
        { name: "application-name", content: "What The Pill" },
        { property: "og:site_name", content: "What The Pill" },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: "en_US" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
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
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    // Optional — interaction checks only (identification uses Gemini)
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
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
