import { Message } from './types/Discord';
import { DiscordInteraction, User } from './types/Interaction';
import { Component, Embed, MessageFlags } from './types/Message';
import { CraftedResponse, Env, ParsedRequest } from './types/Routes';
import { chunk } from './utils/array';
import { bulkDeleteMessages, getChannelMessages } from './utils/discord';

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

export const Interactions: Interaction[] = [
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
