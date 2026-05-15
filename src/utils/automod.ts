import { Env } from '../types/Routes';

export interface Phash {
  phash: string;
  type: string;
}

export interface PhashListResponse {
  phashes: Phash[];
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
