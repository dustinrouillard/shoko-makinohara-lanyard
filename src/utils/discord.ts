import { Member } from '../types/Interaction';
import { User } from '../types/Discord';
import { Env } from '../types/Routes';

export const DISCORD_EPOCH = 1420070400000;

export function idToTimestamp(id: string) {
  const milliseconds = BigInt(id) >> BigInt(22);
  return new Date(Number(milliseconds) + DISCORD_EPOCH);
}

export async function getLanyardMember(context: Record<string, any> & { env: Env }, id: string) {
  const req = await fetch(`https://discord.com/api/v8/guilds/${context.env.GUILD_ID}/members/${id}`, {
    headers: { authorization: `Bot ${context.env.DISCORD_TOKEN}` },
  });

  if (req.status != 200) throw { code: 'user_not_found_or_invalid' };

  return (await req.json()) as Member;
}

export async function getDiscordUser(context: Record<string, any> & { env: Env }, id: string): Promise<User | null> {
  const data = await fetch(`https://discord.com/api/v8/users/${id}`, {
    headers: { authorization: `Bot ${context.env.DISCORD_TOKEN}` },
  }).then((r) => r.json() as unknown as User | { code: number });
  if ('code' in data) return null;

  return data;
}
