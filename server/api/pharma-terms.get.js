import { loadPharmaTerms } from '../utils/pharmaTerms.js'
import { getPharmaTerms } from '#shared/pillIdentity'

export default defineEventHandler(async () => {
  await loadPharmaTerms()
  return getPharmaTerms()
})
