import { normalizePill, dedupeCabinet } from '#shared/pillIdentity'

export { normalizePill, dedupeCabinet }

function normalizeResponse(parsed, uploadedPhoto) {
  let matches = parsed.matches || []
  if (!matches.length && parsed.id) {
    matches = [parsed]
  }

  matches = dedupeCabinet(
    matches
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 5)
      .map(match => normalizePill(match))
  ).sort((a, b) => (b.confidence || 0) - (a.confidence || 0))

  return {
    matches,
    uploadedPhoto: uploadedPhoto || null
  }
}

export { normalizeResponse }
