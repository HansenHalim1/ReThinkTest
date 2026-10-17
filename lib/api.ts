// NEXT_PUBLIC_ values are included in the browser bundle at build time.
import { getSupabase } from './supabase';
const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || 'https://rethinkbackend.vercel.app').replace(/\/+$/, '');

export function apiUrl(path: '/api/health' | '/api/feedback' | '/api/me' | '/api/progress'): string {
  return `${apiBaseUrl}${path}`;
}

export async function accountRequest(path: '/api/feedback' | '/api/me' | '/api/progress', init: RequestInit = {}): Promise<Response> {
  const auth = getSupabase()?.auth;
  if (!auth) throw Error('Layanan akun belum tersedia.');
  const { data, error } = await auth.getSession();
  if (error || !data.session) throw Error('Silakan masuk kembali.');
  const send = (token: string) => {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    const timeout = AbortSignal.timeout(25000);
    const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    return fetch(apiUrl(path), { ...init, headers, signal, cache: 'no-store' });
  };
  const response = await send(data.session.access_token);
  if (response.status !== 401) return response;
  const refreshed = await auth.refreshSession();
  if (refreshed.error || !refreshed.data.session) throw Error('Sesi berakhir. Silakan masuk kembali.');
  return send(refreshed.data.session.access_token);
}
