/**
 * Gemini — pill identification for imprint, describe, and photo modes.
 * Netlify-compatible (HTTP API call from serverless function).
 */
import { GoogleGenerativeAI } from '@google/generative-ai'

const IDENTIFY_PROMPT = `You are a pill identification assistant. Given an imprint code, description, or image, identify likely medications and return structured JSON. Be accurate and clear. Never diagnose — only identify and inform.

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
  ],
  "observations": {
    "imprint": "<exact visible imprint or null — photo mode only>",
    "shape": "<visible shape or null>",
    "color": "<visible color or null>",
    "description": "<one sentence describing visible features — photo mode only>"
  }
}

If you cannot identify the pill with any confidence, return one match with confidence 0 and explain in summary.`

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_MODEL_FALLBACKS = ['gemini-2.5-flash-lite']

function getGeminiConfig(config) {
  const preferred = config.geminiModel || DEFAULT_GEMINI_MODEL
  const models = [...new Set([preferred, ...GEMINI_MODEL_FALLBACKS])]
  return {
    apiKey: config.geminiApiKey,
    models,
  }
}

function isModelNotFoundError(err) {
  const msg = String(err?.message || err)
  return msg.includes('404') || msg.includes('not found') || msg.includes('no longer available')
}

function logGeminiResponse(label, { model, ms, textLength, matchCount }) {
  console.log(`[gemini:${label}]`, { model, ms, textLength, matchCount })
}

function normalizeConfidence(value) {
  if (typeof value !== 'number') return 50
  const scaled = value <= 1 ? value * 100 : value
  return Math.min(100, Math.max(0, Math.round(scaled)))
}

function parseGeminiJson(text) {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Gemini returned non-JSON response')
    return JSON.parse(match[0])
  }
}

function normalizeGeminiMatch(match) {
  const confidence = normalizeConfidence(match.confidence)

  return {
    id: match.id || 'unknown',
    name: match.name || 'Unknown medication',
    genericName: match.genericName || '',
    ingredients: match.ingredients || '',
    confidence,
    matchSource: 'gemini',
    physical: {
      shape: match.physical?.shape || '',
      color: match.physical?.color || '',
      imprint: match.physical?.imprint || '',
      size: match.physical?.size || '',
    },
    summary: match.summary || '',
    uses: match.uses || '',
    dosage: match.dosage || '',
    safetyLevel: match.safetyLevel || 'moderate',
    safetyNote: match.safetyNote || 'This is an identification result, not medical advice. Consult a pharmacist or doctor with questions.',
    sources: match.sources?.length
      ? match.sources
      : [
        { name: 'OpenFDA', found: false },
        { name: 'DailyMed', found: false },
        { name: 'RxNav', found: false },
      ],
  }
}

function formatObservations(observations) {
  if (!observations) return null
  if (observations.description) return observations.description

  const parts = []
  if (observations.imprint) parts.push(`imprint "${observations.imprint}"`)
  if (observations.color) parts.push(`${observations.color} color`)
  if (observations.shape) parts.push(`${observations.shape} shape`)
  return parts.length ? parts.join(', ') : null
}

function toIdentifyResult(parsed, model, processingMs) {
  const matches = (parsed.matches || [])
    .map(normalizeGeminiMatch)
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))

  const observations = parsed.observations || null

  return {
    matches,
    observations,
    photoDescription: formatObservations(observations),
    processingMs,
    modelVersions: { model, source: 'gemini' },
  }
}

async function generateGeminiJson(content, config, label) {
  const { apiKey, models } = getGeminiConfig(config)
  if (!apiKey) {
    console.warn('[geminiVision] GEMINI_API_KEY not configured')
    return null
  }

  const start = Date.now()
  const genAI = new GoogleGenerativeAI(apiKey)
  let lastError

  for (const model of models) {
    try {
      const gemini = genAI.getGenerativeModel({
        model,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      })

      const result = await gemini.generateContent(content)
      const text = result.response.text()
      const processingMs = Date.now() - start
      const parsed = parseGeminiJson(text)
      const identifyResult = toIdentifyResult(parsed, model, processingMs)

      logGeminiResponse(label, {
        model,
        ms: processingMs,
        textLength: text.length,
        matchCount: identifyResult.matches.length,
      })

      return identifyResult
    } catch (err) {
      lastError = err
      if (isModelNotFoundError(err)) {
        console.warn(`[geminiVision] model ${model} unavailable, trying next`)
        continue
      }
      throw err
    }
  }

  throw lastError || new Error('No Gemini models available')
}

function requireGeminiKey(config) {
  if (!config.geminiApiKey) {
    throw createError({
      statusCode: 503,
      message: 'Pill identification is unavailable. Set GEMINI_API_KEY on the server.',
    })
  }
}

/**
 * @param {'imprint'|'describe'} mode
 * @param {string} query
 * @param {object} config
 */
export async function identifyFromTextWithGemini(mode, query, config) {
  requireGeminiKey(config)

  const userPrompt = mode === 'imprint'
    ? `Identify pills with imprint code "${query}". Return the top 3-5 most likely matches from OpenFDA, DailyMed, and RxNav data.`
    : `Identify pills matching this description: "${query}". Return the top 3-5 most likely matches.`

  return generateGeminiJson(
    [{ text: `${IDENTIFY_PROMPT}\n\n${userPrompt}` }],
    config,
    mode,
  )
}

/**
 * @param {Array<{ base64: string, mime: string }>} images
 * @param {object} config
 */
export async function identifyPillImagesWithGemini(images, config) {
  requireGeminiKey(config)

  if (!images?.length) return null

  const imageParts = images.map((img) => ({
    inlineData: {
      mimeType: img.mime || 'image/jpeg',
      data: img.base64,
    },
  }))

  const userPrompt = images.length === 2
    ? 'Identify this pill from the photos. Two photos show different sides of the same pill. Return the top 3-5 most likely matches with imprint, shape, and color for each.'
    : 'Identify this pill from the photo. Return the top 3-5 most likely matches with imprint, shape, and color for each.'

  return generateGeminiJson(
    [{ text: `${IDENTIFY_PROMPT}\n\n${userPrompt}` }, ...imageParts],
    config,
    'photo',
  )
}
