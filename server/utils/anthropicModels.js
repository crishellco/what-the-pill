export function getAnthropicModels(config) {
  const model = config.anthropicModel || 'claude-opus-4-6'
  return { model }
}

export function logAnthropicResponse(label, message) {
  const text = message.content
    ?.filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('') ?? ''

  console.log(`[anthropic:${label}]`, {
    id: message.id,
    model: message.model,
    stop_reason: message.stop_reason,
    usage: message.usage,
    text
  })
}
