import { Message } from './types/Discord';
import { DiscordInteraction, User } from './types/Interaction';
import { Component, Embed, MessageFlags } from './types/Message';
import { CraftedResponse, Env, ParsedRequest } from './types/Routes';
import { chunk } from './utils/array';
import { addPhashesFromUrls, normalizeType } from './utils/automod';
import { bulkDeleteMessages, deleteChannelMessage, editOriginalInteractionResponse, getChannelMessage, getChannelMessages, kickGuildMember } from './utils/discord';
import { EventType, sendPhashReportEvent, sendUserEvent } from './utils/events';

export type Context = Record<string, any> & { env: Env };

export interface Interaction {
  name: string;
  content?: string;
  ephemeral?: boolean;
  post_channels?: string[];
  prehandler?: (context: Context, body: DiscordInteraction, user: User) => Context | Promise<Context>;
  embed?: (context: Context, body: DiscordInteraction, user: User, request: ParsedRequest) => Partial<Embed> | Promise<Partial<Embed>>;
  components?: (context: Context, body: DiscordInteraction, user: User) => Partial<Component[]> | Promise<Partial<Component[]>>;
  function?: (context: Context, body: DiscordInteraction, user: User, response: CraftedResponse) => Promise<void>;
}

export interface ModalHandler {
  custom_id: string;
  handler: (context: Context, body: DiscordInteraction, user: User, response: CraftedResponse) => Promise<void>;
}

export interface ComponentHandler {
  custom_id: string;
  handler: (context: Context, body: DiscordInteraction, user: User, response: CraftedResponse) => Promise<void>;
}

function collectImageUrls(message: Message | null | undefined): string[] {
  if (!message) return [];
  const urls = new Set<string>();
  for (const a of message.attachments ?? []) {
    if (a.content_type?.startsWith('image/')) urls.add(a.proxy_url ?? a.url);
  }
  for (const e of message.embeds ?? []) {
    const url = e.image?.proxy_url ?? e.image?.url ?? e.thumbnail?.proxy_url ?? e.thumbnail?.url;
    if (url) urls.add(url);
  }
  return Array.from(urls);
}

function phashScamModalResponse(channelId: string, messageId: string, imageCount: number) {
  return {
    type: 9,
    data: {
      custom_id: `phash_scam:${channelId}:${messageId}`,
      title: `Report ${imageCount} image${imageCount === 1 ? '' : 's'}`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'type',
              label: 'Type',
              style: 1,
              min_length: 1,
              max_length: 40,
              required: true,
              placeholder: 'e.g. CRYPTO_SCAM',
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'reason',
              label: 'Reason',
              style: 2,
              min_length: 1,
              max_length: 500,
              required: true,
              placeholder: 'Why is this being reported?',
            },
          ],
        },
      ],
    },
  };
}

export const Interactions: Interaction[] = [
  {
    name: 'Report scam images',
    function: async (context: Context, body: DiscordInteraction, user: User, response: CraftedResponse) => {
      const targetId = body.data.target_id;
      const message = targetId ? body.data.resolved?.messages?.[targetId] : undefined;
      const images = collectImageUrls(message);

      if (images.length === 0) {
        return response.status(200).send({
          type: 4,
          data: {
            flags: MessageFlags.Ephemeral,
            content: 'That message has no images (attachments or embedded) to hash.',
          },
        });
      }

      return response.status(200).send(phashScamModalResponse(body.channel_id, targetId!, images.length));
    },
  },
  {
    name: 'Delete up to this message',
    ephemeral: true,
    function: async (context: Context, body: DiscordInteraction, user: User, response: CraftedResponse) => {
      let deleted = 0;
      const after = body.data.target_id;

      const messages = await getChannelMessages(context, body.channel_id, { after, limit: 100 });
      const chunks = chunk<Message>(messages, 100);
      const promises = chunks.map((chunk, index) =>
        bulkDeleteMessages(
          context,
          body.channel_id,
          chunk.map((message) => message.id),
        ).catch((error: string) => {
          console.log('Failed to delete messages, chunk', index, error);
          return response.status(200).send({
            type: 4,
            data: {
              flags: MessageFlags.Ephemeral,
              content: error,
            },
          });
        }),
      );
      await Promise.all(promises);
      deleted = messages.length;

      return response.status(200).send({
        type: 4,
        data: {
          flags: MessageFlags.Ephemeral,
          content: `Done ✅ \`Removed ${deleted} messages\``,
        },
      });
    },
  },
];

export const ComponentHandlers: ComponentHandler[] = [
  {
    custom_id: 'automod_phash_add',
    handler: async (context: Context, body: DiscordInteraction, user: User, response: CraftedResponse) => {
      const message = body.message;
      if (!message?.id) {
        return response.status(200).send({
          type: 4,
          data: { flags: MessageFlags.Ephemeral, content: 'Missing message reference.' },
        });
      }

      const images = collectImageUrls(message);
      if (images.length === 0) {
        return response.status(200).send({
          type: 4,
          data: { flags: MessageFlags.Ephemeral, content: 'No images on that message to hash.' },
        });
      }

      return response.status(200).send(phashScamModalResponse(body.channel_id, message.id, images.length));
    },
  },
  {
    custom_id: 'phash_delete',
    handler: async (context: Context, body: DiscordInteraction, user: User, response: CraftedResponse) => {
      const [, channelId, messageId] = (body.data.custom_id ?? '').split(':');
      if (!channelId || !messageId) {
        return response.status(200).send({ type: 7, data: { content: 'Invalid reference.', components: [] } });
      }

      const ok = await deleteChannelMessage(context, channelId, messageId).catch(() => false);

      const original = (body.message as any)?.content ?? '';
      const remaining = (body.message as any)?.components?.[0]?.components?.filter((c: any) => !String(c.custom_id ?? '').startsWith('phash_delete')) ?? [];
      const newComponents = remaining.length ? [{ type: 1, components: remaining }] : [];

      return response.status(200).send({
        type: 7,
        data: {
          content: `${original}\n${ok ? '🗑️ Message deleted.' : '⚠️ Could not delete message.'}`,
          components: newComponents,
        },
      });
    },
  },
  {
    custom_id: 'phash_kick',
    handler: async (context: Context, body: DiscordInteraction, user: User, response: CraftedResponse) => {
      const [, userId] = (body.data.custom_id ?? '').split(':');
      if (!userId) {
        return response.status(200).send({ type: 7, data: { content: 'Invalid reference.', components: [] } });
      }

      const ok = await kickGuildMember(context, userId, `Kicked by ${user.username} via pHash report`).catch(() => false);
      if (ok) {
        await sendUserEvent(context.env, EventType.UserKicked, { actor: user.id, target: userId });
      }

      const original = (body.message as any)?.content ?? '';
      const remaining = (body.message as any)?.components?.[0]?.components?.filter((c: any) => !String(c.custom_id ?? '').startsWith('phash_kick')) ?? [];
      const newComponents = remaining.length ? [{ type: 1, components: remaining }] : [];

      return response.status(200).send({
        type: 7,
        data: {
          content: `${original}\n${ok ? `👢 <@${userId}> kicked.` : `⚠️ Could not kick <@${userId}>.`}`,
          components: newComponents,
        },
      });
    },
  },
];

async function runPhashReport(
  context: Context,
  body: DiscordInteraction,
  user: User,
  channelId: string,
  messageId: string,
  type: string,
  reason: string,
) {
  const followup = (content: string, components: any[] = []) =>
    editOriginalInteractionResponse(body.application_id, body.token, { content, components });

  const message = await getChannelMessage(context, channelId, messageId);
  const images = collectImageUrls(message);
  if (images.length === 0) return followup('That message no longer has any images to hash.');

  const results = await addPhashesFromUrls(context.env, images, type);
  if (!results) return followup('Failed to reach automod API.');

  const added = results.filter((r) => r.added).length;
  const duplicates = results.filter((r) => r.already_existed).length;
  const errors = results.filter((r) => r.error).length;

  const lines = results.map((r) => {
    if (r.error) return `❌ \`${r.source}\` — ${r.error}`;
    if (r.already_existed) return `↩️ \`${r.phash}\` already tracked as \`${r.type}\``;
    return `✅ \`${r.phash}\` added as \`${r.type}\``;
  });

  const messageLink = `https://discord.com/channels/${context.env.GUILD_ID}/${channelId}/${messageId}`;
  await sendPhashReportEvent(context.env, {
    actor: user.id,
    message_link: messageLink,
    type,
    reason,
    added,
    duplicates,
    errors,
    phashes: lines.join('\n'),
  });

  const authorId = message?.author?.id;
  const isBot = !!message?.author?.bot;
  const showKick = !!authorId && !isBot && authorId !== user.id;

  const buttons: any[] = [
    {
      type: 2,
      style: 4,
      label: 'Delete message',
      custom_id: `phash_delete:${channelId}:${messageId}`,
      emoji: { name: '🗑️' },
    },
  ];
  if (showKick) {
    buttons.push({
      type: 2,
      style: 4,
      label: 'Kick member',
      custom_id: `phash_kick:${authorId}`,
      emoji: { name: '👢' },
    });
  }

  return followup(
    `Reported as \`${type}\` — **${added}** added, **${duplicates}** duplicate, **${errors}** failed.\n${lines.join('\n')}`,
    [{ type: 1, components: buttons }],
  );
}

export const ModalHandlers: ModalHandler[] = [
  {
    custom_id: 'phash_scam',
    handler: async (context: Context, body: DiscordInteraction, user: User, response: CraftedResponse) => {
      const reply = (content: string) =>
        response.status(200).send({
          type: 4,
          data: { flags: MessageFlags.Ephemeral, content },
        });

      const [, channelId, messageId] = (body.data.custom_id ?? '').split(':');
      if (!channelId || !messageId) return reply('Invalid modal reference.');

      const inputs = (body.data.components ?? []).flatMap((row) => row.components);
      const rawType = inputs.find((c) => c.custom_id === 'type')?.value ?? '';
      const reason = (inputs.find((c) => c.custom_id === 'reason')?.value ?? '').trim();

      const type = normalizeType(rawType);
      if (!type) return reply('Invalid type — must be UPPER_SNAKE_CASE (1–40 chars).');
      if (!reason) return reply('A reason is required.');

      response.status(200).send({
        type: 5,
        data: { flags: MessageFlags.Ephemeral },
      });

      context.waitUntil(
        runPhashReport(context, body, user, channelId, messageId, type, reason).catch((error) => {
          console.error('phash report failed', error);
          return editOriginalInteractionResponse(body.application_id, body.token, {
            content: 'Failed to process pHash report — check logs.',
            components: [],
          });
        }),
      );
    },
  },
];
