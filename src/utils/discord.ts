import { stringify } from 'node:querystring';
import type { Message, User } from '../types/Discord';
import type { Member } from '../types/Interaction';
import type { Env } from '../types/Routes';

export const DISCORD_EPOCH = 1420070400000;

export function idToTimestamp(id: string) {
  const milliseconds = BigInt(id) >> BigInt(22);
  return new Date(Number(milliseconds) + DISCORD_EPOCH);
}

export async function getLanyardMember(context: Record<string, any> & { env: Env }, id: string) {
  const req = await fetch(`https://discord.com/api/v8/guilds/${context.env.GUILD_ID}/members/${id}`, {
    headers: { authorization: `Bot ${context.env.DISCORD_TOKEN}` },
  });

  if (req.status !== 200) throw { code: 'user_not_found_or_invalid' };

  return (await req.json()) as Member;
}

export async function getDiscordUser(context: Record<string, any> & { env: Env }, id: string): Promise<User | null> {
  const data = await fetch(`https://discord.com/api/v8/users/${id}`, {
    headers: { authorization: `Bot ${context.env.DISCORD_TOKEN}` },
  }).then((r) => r.json() as unknown as User | { code: number });
  if ('code' in data) return null;

  return data;
}

export async function getChannelMessages(
  context: Record<string, any> & { env: Env },
  id: string,
  { limit, before, after }: { limit?: number; before?: string; after?: string },
): Promise<Message[]> {
  // TODO: Handle pagination based on before and after if the count is over 100
  // And if we pass an after we need to get messages untill there is none left to get

  const items = { limit, before, after };
  const params = stringify(Object.fromEntries(Object.entries(items).filter(([, v]) => v != null)));
  const data = await fetch(`https://discord.com/api/v9/channels/${id}/messages?${params}`, {
    headers: { authorization: `Bot ${context.env.DISCORD_TOKEN}` },
  }).then((r) => r.json() as unknown as Message[]);

  if (after && data.length === limit) {
    const next = await getChannelMessages(context, id, { limit, after: data[0].id });
    return [...data, ...next];
  }

  return data;
}

export async function bulkDeleteMessages(context: Record<string, any> & { env: Env }, id: string, messages: string[]): Promise<Response> {
  const req = await fetch(`https://discord.com/api/v9/channels/${id}/messages/bulk-delete`, {
    method: 'POST',
    body: JSON.stringify({ messages }),
    headers: { authorization: `Bot ${context.env.DISCORD_TOKEN}`, 'content-type': 'application/json' },
  });

  if (req.status !== 204) {
    const body: { code: number; retry_after?: number } = await req.json();

    if ('retry_after' in body) {
      await new Promise((resolve) => setTimeout(resolve, (body.retry_after ?? 1) * 1000));
      return await bulkDeleteMessages(context, id, messages);
    }

    if (body.code === 50034) {
      throw `Failed to delete messages as there are messages older than 2 weeks in your selection`;
    } else {
      throw `Failed to delete messages, report to Dustin`;
    }
  }

  return req;
}
