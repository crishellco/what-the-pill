/**
 * Pill identification endpoint — all modes use Gemini.
 *
 * Pipeline:
 *   imprint  → Gemini text
 *   describe → Gemini text
 *   photo    → Gemini vision
 */
import { normalizeResponse } from '../utils/pillNormalize.js'
import { dedupeCabinet, normalizePill } from '#shared/pillIdentity'
import { loadPharmaTerms, discoverAndSaveTerms } from '../utils/pharmaTerms.js'
import { identifyFromTextWithGemini, identifyPillImagesWithGemini } from '../utils/geminiVision.js'

const MAX_PHOTO_BYTES = 10 * 1024 * 1024

async function readPhotoFromForm(form, fieldName) {
  const file = form.get(fieldName)
  if (!file || typeof file === 'string') return null

  const mime = file.type || 'image/jpeg'
  if (!mime.startsWith('image/')) {
    throw createError({ statusCode: 400, message: 'Upload must be an image file.' })
  }

  const buffer = await file.arrayBuffer()
  if (buffer.byteLength > MAX_PHOTO_BYTES) {
    throw createError({ statusCode: 400, message: 'Each photo must be 10MB or smaller.' })
  }

  const base64 = Buffer.from(buffer).toString('base64')

  return { base64, mime, dataUrl: `data:${mime};base64,${base64}` }
}

function dataUrlToImage(dataUrl) {
  if (!dataUrl?.startsWith('data:')) return null
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return { mime: match[1], base64: match[2], dataUrl }
}

async function finalizeResult(matches, { uploadedPhoto, uploadedPhotoSide2, photoDescription, matchSource }) {
  let result = normalizeResponse({ matches }, uploadedPhoto, uploadedPhotoSide2)

  if (photoDescription) result.photoDescription = photoDescription
  if (matchSource) result.matchSource = matchSource

  const termsAdded = await discoverAndSaveTerms(result.matches)
  if (termsAdded) {
    result = {
      ...result,
      matches: dedupeCabinet(result.matches.map((match) => normalizePill(match)))
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0)),
    }
  }

  return result
}

function noMatchResult(query, mode) {
  const summary = mode === 'photo'
    ? 'Could not identify this pill from the photo. Try a clearer image with good lighting, or search by imprint code.'
    : `Could not identify any pills matching "${query}". Try a different search or upload a photo.`

  return [{
    id: 'unknown',
    name: 'No match found',
    genericName: '',
    ingredients: '',
    confidence: 0,
    matchSource: 'gemini',
    physical: { shape: '', color: '', imprint: mode === 'imprint' ? query : '', size: '' },
    summary,
    uses: '',
    dosage: '',
    safetyLevel: 'moderate',
    safetyNote: 'Unable to identify this pill. Do not take unidentified medication — consult a pharmacist or doctor.',
    sources: [
      { name: 'OpenFDA', found: false },
      { name: 'DailyMed', found: false },
      { name: 'RxNav', found: false },
    ],
  }]
}

async function handleGeminiResult(geminiResult, { mode, query, uploadedPhoto, uploadedPhotoSide2 }) {
  const photoDescription = geminiResult?.photoDescription || null
  const matches = geminiResult?.matches?.length
    ? geminiResult.matches
    : noMatchResult(query || photoDescription || mode, mode)

  return finalizeResult(matches, {
    uploadedPhoto,
    uploadedPhotoSide2,
    photoDescription,
    matchSource: 'gemini',
  })
}

export default defineEventHandler(async (event) => {
  await loadPharmaTerms()
  const config = useRuntimeConfig()

  let mode, query, body
  let uploadedPhoto, uploadedPhotoSide2
  const photoImages = []

  const contentType = getRequestHeader(event, 'content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const form = await readFormData(event)
    mode = form.get('mode')

    const side1 = await readPhotoFromForm(form, 'photo')
    const side2 = await readPhotoFromForm(form, 'photoSide2')

    if (side1) {
      photoImages.push(side1)
      uploadedPhoto = side1.dataUrl
    }
    if (side2) {
      photoImages.push(side2)
      uploadedPhotoSide2 = side2.dataUrl
    }
  } else {
    body = await readBody(event)
    mode = body.mode
    query = body.query

    if (mode === 'photo') {
      uploadedPhoto = body.uploadedPhoto ?? null
      uploadedPhotoSide2 = body.uploadedPhotoSide2 ?? null
      const img1 = dataUrlToImage(uploadedPhoto)
      const img2 = dataUrlToImage(uploadedPhotoSide2)
      if (img1) photoImages.push(img1)
      if (img2) photoImages.push(img2)
    }
  }

  if (mode === 'photo') {
    if (!photoImages.length) {
      throw createError({ statusCode: 400, message: 'At least one pill photo is required.' })
    }

    try {
      const geminiResult = await identifyPillImagesWithGemini(photoImages, config)
      return handleGeminiResult(geminiResult, {
        mode: 'photo',
        uploadedPhoto,
        uploadedPhotoSide2,
      })
    } catch (err) {
      console.error('[identify:photo] Gemini error:', err.message)
      throw createError({
        statusCode: 502,
        message: 'Could not analyze the pill photo. Please try again or use imprint search.',
      })
    }
  }

  if (!query?.trim()) {
    throw createError({ statusCode: 400, message: 'Search query is required.' })
  }

  let geminiResult
  try {
    geminiResult = await identifyFromTextWithGemini(mode, query, config)
  } catch (err) {
    console.error(`[identify:${mode}] Gemini error:`, err.message)
    throw createError({
      statusCode: 502,
      message: 'Could not identify the pill. Please try again.',
    })
  }

  return handleGeminiResult(geminiResult, { mode, query })
})
