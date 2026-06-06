import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are a pill identification assistant. Given an imprint code, description, or image, identify the medication and return a structured JSON response. Be accurate and clear. Never diagnose — only identify and inform.

Always respond with this exact JSON structure:
{
  "id": "<unique slug like 'acetaminophen-500-l484'>",
  "name": "<brand name or drug name>",
  "genericName": "<generic name if different>",
  "confidence": <0-100 integer>,
  "physical": {
    "shape": "<shape>",
    "color": "<color>",
    "imprint": "<imprint if known>",
    "size": "<approximate size>"
  },
  "summary": "<2-3 plain English sentences: what this drug is, what class it belongs to>",
  "uses": "<plain English: what it's commonly taken for>",
  "dosage": "<typical OTC or common prescription dosage range>",
  "safetyLevel": "<low|moderate|high>",
  "safetyNote": "<one plain English sentence answering 'should I be worried about finding this pill?'>",
  "sources": [
    { "name": "OpenFDA", "found": true/false },
    { "name": "DailyMed", "found": true/false },
    { "name": "RxNav", "found": true/false }
  ]
}

If you cannot identify the pill with any confidence, set confidence to 0 and explain in summary.`

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const client = new Anthropic({ apiKey: config.anthropicApiKey })

  let mode, query, imageBase64, imageMime

  const contentType = getRequestHeader(event, 'content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const form = await readFormData(event)
    mode = form.get('mode')
    const file = form.get('photo')
    if (file) {
      const buffer = await file.arrayBuffer()
      imageBase64 = Buffer.from(buffer).toString('base64')
      imageMime = file.type || 'image/jpeg'
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
        text: 'Please identify this pill from the photo. Look for the imprint, shape, color, and any other identifying features.'
      }
    ]
  } else if (mode === 'imprint') {
    userContent = `Identify the pill with imprint code: "${query}". Check OpenFDA, DailyMed, and RxNav databases in your training data.`
  } else {
    userContent = `Identify a pill described as: "${query}".`
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }]
  })

  const text = message.content[0].text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw createError({ statusCode: 500, message: 'Could not parse identification result.' })
  }

  return JSON.parse(jsonMatch[0])
})
