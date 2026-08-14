import { DcdnBadge } from './dcdn';

// Discord's tiered profile badges. Each emoji list runs tier 1 → 10 and lines up
// positionally with the badge's `tiers` array from the profile API, so the tier a
// user is on is just the index of `current_tier` in that array.
const ACCOUNT_AGE = [
  '<:account_age_1:1537876554380611735>',
  '<:account_age_2:1537876581853307051>',
  '<:account_age_3:1537876583207936030>',
  '<:account_age_4:1537876584613289995>',
  '<:account_age_5:1537876586664300556>',
  '<:account_age_6:1537876589226893392>',
  '<:account_age_7:1537876591403597874>',
  '<:account_age_8:1537876593043710042>',
  '<:account_age_9:1537876595149115434>',
  '<:account_age_10:1537876597112184852>',
];

const GAME_DEPTH = [
  '<:game_depth_tier_1:1537876621770489996>',
  '<:game_depth_tier_2:1537876623657803927>',
  '<:game_depth_tier_3:1537876625557823559>',
  '<:game_depth_tier_4:1537876627260842096>',
  '<:game_depth_tier_5:1537876630150840411>',
  '<:game_depth_tier_6:1537876632684204175>',
  '<:game_depth_tier_7:1537876634487754842>',
  '<:game_depth_tier_8:1537876638128414903>',
  '<:game_depth_tier_9:1537876642939142264>',
  '<:game_depth_tier_10:1537876644424065075>',
];

const GAME_DIVERSITY = [
  '<:game_diversity_tier_1:1537876662526419041>',
  '<:game_diversity_tier_2:1537876664569172049>',
  '<:game_diversity_tier_3:1537876666901340230>',
  '<:game_diversity_tier_4:1537876668524527636>',
  '<:game_diversity_tier_5:1537876670868885514>',
  '<:game_diversity_tier_6:1537876673092001832>',
  '<:game_diversity_tier_7:1537876675000410113>',
  '<:game_diversity_tier_8:1537876677819105443>',
  '<:game_diversity_tier_9:1537876679635243068>',
  '<:game_diversity_tier_10:1537876681308766280>',
];

const HOURS_STREAMED = [
  '<:hours_streamed_1:1537876708483399710>',
  '<:hours_streamed_2:1537876716943577201>',
  '<:hours_streamed_3:1537876719896371281>',
  '<:hours_streamed_4:1537876721896919191>',
  '<:hours_streamed_5:1537876724874743928>',
  '<:hours_streamed_6:1537876727450304632>',
  '<:hours_streamed_7:1537876736627318825>',
  '<:hours_streamed_8:1537876738078671000>',
  '<:hours_streamed_9:1537876739773046796>',
  '<:hours_streamed_10:1537876754839109693>',
];

export interface TieredBadge {
  badge_id: number;
  name: string;
  emojis: string[];
}

export const TIERED_BADGES: TieredBadge[] = [
  { badge_id: 18, name: 'Account Age', emojis: ACCOUNT_AGE },
  { badge_id: 20, name: 'Game Time', emojis: GAME_DEPTH },
  { badge_id: 21, name: 'Game Variety', emojis: GAME_DIVERSITY },
  { badge_id: 19, name: 'Streaming', emojis: HOURS_STREAMED },
];

export interface ResolvedBadge {
  name: string;
  emoji: string;
  tier: number;
  tier_name: string;
  info: string | null;
  next: string | null;
}

function titleize(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function resolveTieredBadges(badges: DcdnBadge[]): ResolvedBadge[] {
  const resolved: ResolvedBadge[] = [];

  for (const definition of TIERED_BADGES) {
    const badge = badges.find((item) => item.badge_id == definition.badge_id);
    if (!badge?.owned || !badge.current_tier || !badge.tiers?.length) continue;

    const index = badge.tiers.findIndex((tier) => tier.key == badge.current_tier);
    const emoji = definition.emojis[index];
    if (index < 0 || !emoji) continue;

    const next = badge.next_tier ? badge.tiers.find((tier) => tier.key == badge.next_tier) : undefined;

    resolved.push({
      name: definition.name,
      emoji,
      tier: index + 1,
      tier_name: badge.tiers[index].name || titleize(badge.current_tier),
      info: badge.info_label || null,
      next: next ? `${next.name || titleize(next.key)}${next.milestone_text ? ` at ${next.milestone_text}` : ''}` : null,
    });
  }

  return resolved;
}
