import Anthropic from '@anthropic-ai/sdk'
import { normalizeResponse } from '../utils/pillNormalize.js'
import { dedupeCabinet, normalizePill } from '#shared/pillIdentity'
import { getCacheKey, getCachedIdentifyResult, setCachedIdentifyResult } from '../utils/identifyCache.js'
import { loadPharmaTerms, discoverAndSaveTerms } from '../utils/pharmaTerms.js'

const SYSTEM_PROMPT = `You are a pill identification assistant. Given an imprint code, description, or image, identify likely medications and return a structured JSON response. Be accurate and clear. Never diagnose — only identify and inform.

Return the top 3 to 5 most likely matches, sorted by confidence (highest first).

IMPORTANT consistency rules:
- Use the same identity for the same physical pill regardless of how it was searched.
- When an imprint is known, "id" MUST be "imprint-{imprint with only letters and numbers, lowercase}" (example: imprint "G 035" -> "imprint-g035").
- "name" should be the generic ingredient-based label with strength when known (example: "Hydrocodone / Acetaminophen 7.5mg/325mg"), not a brand name alone.
- Put common brand names in "genericName" (example: "Also known as: Vicodin, Norco").
- "ingredients" must list active ingredients only, normalized and comma-separated (example: "hydrocodone, acetaminophen").
- If two matches are the same drug product, do not return duplicates.

Always respond with this exact JSON structure:
{
  "matches": [
    {
      "id": "<imprint-{normalized imprint} when imprint known, else rx-{sorted-ingredient-slugs}>",
      "name": "<generic ingredient label with strength when known>",
      "genericName": "<brand names or alternate names, if any>",
      "ingredients": "<active ingredient(s), lowercase, comma-separated>",
      "confidence": <0-100 integer>,
      "physical": {
        "shape": "<round|oval|capsule|oblong|etc>",
        "color": "<color>",
        "imprint": "<imprint if known>",
        "size": "<approximate size>"
      },
      "summary": "<2-3 plain English sentences>",
      "uses": "<what it's commonly taken for>",
      "dosage": "<typical dosage range>",
      "safetyLevel": "<low|moderate|high>",
      "safetyNote": "<one plain English sentence for 'should I be worried?'>",
      "sources": [
        { "name": "OpenFDA", "found": true/false },
        { "name": "DailyMed", "found": true/false },
        { "name": "RxNav", "found": true/false }
      ]
    }
  ]
}

If you cannot identify the pill with any confidence, return one match with confidence 0 and explain in summary.`

export default defineEventHandler(async (event) => {
  await loadPharmaTerms()

  const config = useRuntimeConfig()
  const client = new Anthropic({ apiKey: config.anthropicApiKey })

  let mode, query, imageBase64, imageMime, uploadedPhoto

  const contentType = getRequestHeader(event, 'content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const form = await readFormData(event)
    mode = form.get('mode')
    const file = form.get('photo')
    if (file) {
      const buffer = await file.arrayBuffer()
      imageBase64 = Buffer.from(buffer).toString('base64')
      imageMime = file.type || 'image/jpeg'
      uploadedPhoto = `data:${imageMime};base64,${imageBase64}`
    }
  } else {
    const body = await readBody(event)
    mode = body.mode
    query = body.query
  }

  let userContent

  if (mode === 'photo' && imageBase64) {
    userContent = [
      {
        type: 'image',
        source: { type: 'base64', media_type: imageMime, data: imageBase64 }
      },
      {
        type: 'text',
        text: 'Identify this pill from the photo. Return the top 3-5 most likely matches with imprint, shape, and color for each.'
      }
    ]
  } else if (mode === 'imprint') {
    userContent = `Identify pills with imprint code "${query}". Return the top 3-5 most likely matches from OpenFDA, DailyMed, and RxNav data.`
  } else {
    userContent = `Identify pills matching this description: "${query}". Return the top 3-5 most likely matches.`
  }

  const cacheKey = getCacheKey(mode, query)
  if (cacheKey) {
    const cached = await getCachedIdentifyResult(cacheKey)
    if (cached) {
      return {
        ...cached,
        uploadedPhoto: uploadedPhoto || cached.uploadedPhoto || null
      }
    }
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }]
  })

  const text = message.content[0].text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw createError({ statusCode: 500, message: 'Could not parse identification result.' })
  }

  let result = normalizeResponse(JSON.parse(jsonMatch[0]), uploadedPhoto)

  const termsAdded = await discoverAndSaveTerms(result.matches)
  if (termsAdded) {
    result = {
      ...result,
      matches: dedupeCabinet(result.matches.map(match => normalizePill(match)))
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    }
  }

  if (cacheKey) {
    await setCachedIdentifyResult(cacheKey, mode, result)
  }

  if (mode === 'photo' && result.matches[0]?.physical?.imprint) {
    const imprintKey = getCacheKey('imprint', result.matches[0].physical.imprint)
    if (imprintKey) {
      await setCachedIdentifyResult(imprintKey, 'imprint', result)
    }
  }

  return result
})
