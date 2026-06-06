const PILL_SHAPES = {
  round: 'rounded-full aspect-square',
  oval: 'rounded-full aspect-[4/3]',
  capsule: 'rounded-full aspect-[2/1]',
  oblong: 'rounded-2xl aspect-[2/1]',
  square: 'rounded-lg aspect-square',
  rectangle: 'rounded-lg aspect-[3/2]',
  diamond: 'rotate-45 aspect-square scale-[0.72]',
  hexagon: 'rounded-md aspect-square'
}

const COLOR_MAP = {
  white: '#f8fafc',
  off: '#f1f5f9',
  'off-white': '#f1f5f9',
  cream: '#fef3c7',
  yellow: '#fde047',
  orange: '#fb923c',
  pink: '#f9a8d4',
  red: '#f87171',
  brown: '#a16207',
  tan: '#d6b58a',
  beige: '#e7d3b0',
  green: '#4ade80',
  blue: '#60a5fa',
  purple: '#c084fc',
  gray: '#94a3b8',
  grey: '#94a3b8',
  black: '#334155',
  clear: '#e2e8f0',
  multi: 'linear-gradient(135deg, #f87171 50%, #f8fafc 50%)'
}

export function pillColorStyle(colorStr = '') {
  const lower = colorStr.toLowerCase()
  for (const [key, value] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) {
      if (value.startsWith('linear')) return { background: value }
      return { backgroundColor: value }
    }
  }
  return { backgroundColor: '#e2e8f0' }
}

export function pillShapeClass(shapeStr = 'round') {
  const lower = shapeStr.toLowerCase()
  for (const [key, cls] of Object.entries(PILL_SHAPES)) {
    if (lower.includes(key)) return cls
  }
  return PILL_SHAPES.round
}
