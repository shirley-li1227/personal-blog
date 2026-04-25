const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const backendOrigin = new URL(apiBase).origin

export function resolveMediaUrl(input?: string | null) {
  if (!input) {
    return ''
  }
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input
  }
  if (input.startsWith('/')) {
    return `${backendOrigin}${input}`
  }
  return `${backendOrigin}/${input}`
}
