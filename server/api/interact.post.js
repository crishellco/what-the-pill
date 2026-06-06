import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are a drug interaction checker. Given a list of medications, identify known interactions between them. Respond with this exact JSON structure:

{
  "summary": "<one plain English sentence summarizing the overall picture>",
  "interactions": [
    {
      "drugs": ["<drug1>", "<drug2>"],
      "severity": "<minor|moderate|serious>",
      "description": "<1-2 plain English sentences explaining what could happen and why it matters>"
    }
  ]
}

If there are no known interactions, return an empty interactions array and say so in the summary. This is informational only — never provide medical advice.`

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { pills } = await readBody(event)

  if (!pills || pills.length < 2) {
    throw createError({ statusCode: 400, message: 'At least 2 pills required.' })
  }

  const client = new Anthropic({ apiKey: config.anthropicApiKey })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Check interactions between these medications: ${pills.join(', ')}`
    }]
  })

  const text = message.content[0].text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw createError({ statusCode: 500, message: 'Could not parse interaction result.' })
  }

  return JSON.parse(jsonMatch[0])
})
