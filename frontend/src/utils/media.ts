function getBackendOrigin() {
  const apiBase = import.meta.env.VITE_API_BASE_URL
  if (apiBase) {
    return new URL(apiBase, window.location.origin).origin
  }
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000'
  }
  return window.location.origin
}

export function resolveMediaUrl(input?: string | null) {
  if (!input) {
    return ''
  }
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input
  }
  const backendOrigin = getBackendOrigin()
  if (input.startsWith('/')) {
    return `${backendOrigin}${input}`
  }
  return `${backendOrigin}/${input}`
}
