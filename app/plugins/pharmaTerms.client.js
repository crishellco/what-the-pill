import { configurePillIdentity } from '#shared/pillIdentity'

export default defineNuxtPlugin(async () => {
  try {
    const terms = await $fetch('/api/pharma-terms')
    configurePillIdentity(terms)
  } catch {
    // Defaults from shared/pillIdentity remain in use
  }
})
