import { loadPharmaTerms, getCachedPharmaTerms } from '../utils/pharmaTerms.js'

export default defineEventHandler(async () => {
  await loadPharmaTerms()
  return getCachedPharmaTerms()
})
