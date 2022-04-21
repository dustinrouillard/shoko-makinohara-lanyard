import { Member } from '../types/Interaction';
import { User } from '../types/Discord';

export const DISCORD_EPOCH = 1420070400000;

export function idToTimestamp(id: string) {
  const milliseconds = BigInt(id) >> BigInt(22);
  return new Date(Number(milliseconds) + DISCORD_EPOCH);
}

export async function getLanyardMember(id: string) {
  const req = await fetch(`https://discord.com/api/v8/guilds/${GUILD_ID}/members/${id}`, {
    headers: { authorization: `Bot ${DISCORD_TOKEN}` },
  });

  if (req.status != 200) throw { code: 'user_not_found_or_invalid' };

  return (await req.json()) as Member;
}

export async function getDiscordUser(id: string): Promise<User | null> {
  const data = await fetch(`https://discord.com/api/v8/users/${id}`, {
    headers: { authorization: `Bot ${DISCORD_TOKEN}` },
  }).then((r) => r.json<User | { code: number }>());
  if ('code' in data) return null;

  return data;
}
