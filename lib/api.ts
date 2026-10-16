// NEXT_PUBLIC_ values are included in the browser bundle at build time.
const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || 'https://rethinkbackend.vercel.app').replace(/\/+$/, '');

export function apiUrl(path: '/api/health' | '/api/feedback'): string {
  return `${apiBaseUrl}${path}`;
}
