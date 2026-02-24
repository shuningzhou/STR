import { useAuthStore } from '@/features/auth/auth-store';

const BASE = '/api';

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE}${path}`;
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    useAuthStore.getState().clearToken();
    window.location.href = '/login';
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { /* ignore */ }
    throw new ApiError(res.status, `${res.status} ${res.statusText}`, body);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return res.json();
}

/** Normalise MongoDB docs: ensure `id` field exists from `_id` */
export function normalizeId<T extends Record<string, unknown>>(doc: T): T & { id: string } {
  const id = (doc.id ?? doc._id ?? '') as string;
  return { ...doc, id: String(id) };
}
