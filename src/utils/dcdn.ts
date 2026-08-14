import { Env } from '../types/Routes';
import { trackServiceError } from './stats';

export interface DcdnBadgeTier {
  key: string;
  name?: string;
  milestone_text?: string;
  owned?: boolean;
}

export interface DcdnBadge {
  badge_id: number;
  name: string;
  description?: string;
  info_label?: string;
  is_earnable?: boolean;
  owned?: boolean;
  current_tier?: string;
  next_tier?: string;
  tiers?: DcdnBadgeTier[];
}

export interface DcdnUser {
  id: string;
  username: string;
  global_name?: string | null;
  discriminator: string;
  avatar: string | null;
  banner?: string | null;
  banner_color?: string | null;
  accent_color?: number | null;
  bot?: boolean;
}

export interface DcdnProfile {
  user?: DcdnUser;
  premium_type?: number;
  premium_since?: string | null;
  premium_guild_since?: string | null;
  private?: boolean;
}

export interface DcdnProfileResponse {
  profile: DcdnProfile;
  badges: DcdnBadge[];
}

// dcdn caches badges as an array but returns them spread onto an object on a cache
// hit (`{...cached}`), so the same route can hand back either shape.
function normalizeBadges(input: unknown): DcdnBadge[] {
  const values = Array.isArray(input)
    ? input
    : input && typeof input == 'object'
      ? Object.entries(input as Record<string, unknown>)
          .filter(([key]) => key != 'cached')
          .map(([, value]) => value)
      : [];

  return values.filter((value): value is DcdnBadge => !!value && typeof value == 'object' && 'badge_id' in (value as object));
}

export async function fetchDcdnProfile(id: string, env?: Env): Promise<DcdnProfileResponse | null> {
  try {
    const req = await fetch(`https://dcdn.dstn.workers.dev/v2/profile/${id}`, { headers: { 'user-agent': 'dstn.to-shoko-makinohara' } });
    if (req.status != 200) {
      if (env) await trackServiceError('dcdn', env);
      return null;
    }

    const data = (await req.json()) as { profile?: DcdnProfile; badges?: unknown; code?: string };
    if (!data?.profile || data.code) return null;

    return { profile: data.profile, badges: normalizeBadges(data.badges) };
  } catch (error) {
    console.error('dcdn api error', error);
    if (env) await trackServiceError('dcdn', env);
    return null;
  }
}
