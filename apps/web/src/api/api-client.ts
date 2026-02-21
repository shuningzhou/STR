const BASE = '/api';
const USER_ID = 'default-user';

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE}${path}`;
  const headers: Record<string, string> = {
    'X-User-Id': USER_ID,
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

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
