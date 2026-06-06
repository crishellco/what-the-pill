import ws from 'ws'

export default defineNitroPlugin(() => {
  if (typeof globalThis.WebSocket === 'undefined') {
    globalThis.WebSocket = ws
  }
})
