export function useCabinet() {
  const cabinet = useState('cabinet', () => {
    if (import.meta.client) {
      const stored = localStorage.getItem('wtp-cabinet')
      return stored ? JSON.parse(stored) : []
    }
    return []
  })

  function persist() {
    if (import.meta.client) {
      localStorage.setItem('wtp-cabinet', JSON.stringify(cabinet.value))
    }
  }

  function addToCabinet(pill) {
    if (!cabinet.value.some(p => p.id === pill.id)) {
      cabinet.value.push(pill)
      persist()
    }
  }

  function removeFromCabinet(id) {
    cabinet.value = cabinet.value.filter(p => p.id !== id)
    persist()
  }

  return { cabinet, addToCabinet, removeFromCabinet }
}
