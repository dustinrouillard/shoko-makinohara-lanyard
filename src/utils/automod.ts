import { Env } from '../types/Routes';

export interface Phash {
  phash: string;
  type: string;
}

export interface PhashListResponse {
  phashes: Phash[];
}

export interface PhashFromImagesResult {
  source: string;
  phash?: string;
  type?: string;
  added: boolean;
  already_existed: boolean;
  error?: string;
}

export async function addPhashesFromUrls(env: Env, urls: string[], type: string): Promise<PhashFromImagesResult[] | null> {
  const fd = new FormData();
  fd.append('type', type);
  for (const url of urls) fd.append('url', url);

  const res = await fetch(`${env.AUTOMOD_API_URL}/v1/phashes/from-images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.AUTOMOD_API_TOKEN}` },
    body: fd,
  });
  if (!res.ok) return null;

  const json = (await res.json()) as unknown;
  if (Array.isArray(json)) return json as PhashFromImagesResult[];
  if (json && typeof json === 'object') {
    for (const key of ['results', 'items', 'phashes']) {
      const value = (json as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value as PhashFromImagesResult[];
    }
  }
  console.log('unexpected from-images response shape', JSON.stringify(json));
  return null;
}

export async function automod(env: Env, method: string, path: string, body?: unknown): Promise<Response> {
  return fetch(`${env.AUTOMOD_API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.AUTOMOD_API_TOKEN}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const PHASH_RE = /^[A-Za-z0-9+/=_-]{1,64}$/;
const TYPE_RE = /^[A-Z0-9_]{1,40}$/;

export function validatePhash(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!PHASH_RE.test(trimmed)) return null;
  return trimmed;
}

export function normalizeType(input: string): string | null {
  const trimmed = input.trim().toUpperCase().replace(/[\s-]/g, '_');
  if (!trimmed) return null;
  if (!TYPE_RE.test(trimmed)) return null;
  return trimmed;
}
