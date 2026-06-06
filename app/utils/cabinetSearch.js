export function getPillSearchText(pill) {
  const ingredients = pill.ingredients
  const ingredientText = Array.isArray(ingredients)
    ? ingredients.join(' ')
    : ingredients || ''

  return [pill.name, pill.genericName, ingredientText, pill.physical?.imprint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function pillMatchesQuery(pill, query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return true
  const haystack = getPillSearchText(pill)
  return terms.every(term => haystack.includes(term))
}
