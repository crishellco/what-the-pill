import { seedPharmaTermsIfEmpty, loadPharmaTerms } from '../utils/pharmaTerms.js'

export default defineNitroPlugin(async () => {
  await seedPharmaTermsIfEmpty()
  await loadPharmaTerms()
})
