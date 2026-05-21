import { Command, Commands } from '../commands';
import { ComponentHandlers, Context, Interaction, Interactions, ModalHandlers } from '../interactions';
import type { DiscordInteraction, User } from '../types/Interaction';
import { Embed, MessageFlags } from '../types/Message';
import type { CraftedResponse, ParsedRequest } from '../types/Routes';
import { trackCommand } from '../utils/stats';

export async function processCommand(name: string, body: DiscordInteraction, request: ParsedRequest, response: CraftedResponse) {
  let command: Command | Interaction | undefined;
  if (body.data.type == 1) command = Commands.find((cmd) => (typeof cmd.command == 'object' ? cmd.command.includes(name) : cmd.command == name));
  else command = Interactions.find((cmd) => cmd.name == name);

  if (!command) return response.status(400).send('invalid request');

  await trackCommand(name, request.env);

  const ephemeral = typeof command.ephemeral == 'undefined' || command.ephemeral;
  const post_channel = command.post_channels && command.post_channels.includes(body.channel_id);
  const flags = post_channel || !body.channel_id ? null : ephemeral ? MessageFlags.Ephemeral : null;

  const user = (body.member?.user || body.user) as User;

  let context: Context = { env: request.env };
  if (command.prehandler) context = await command.prehandler(context, body, user);

  if ('error' in context) {
    const error = context.error as Partial<Embed>;
    return response.status(200).send({
      type: 4,
      data: {
        flags,
        content: command.content,
        embeds: [error],
      },
    });
  }

  const components = command.components ? [{ type: 1, components: await command.components(context, body, user) }] : undefined;

  try {
    if (command.function) {
      return await command.function(context, body, user, response);
    } else if (command.embed) {
      return response.status(200).send({
        type: 4,
        data: {
          flags,
          content: command.content,
          embeds: [await command.embed(context, body, user, request)],
          components,
        },
      });
    } else if (command.content) {
      return response.status(200).send({
        type: 4,
        data: {
          flags,
          content: command.content,
          components,
        },
      });
    } else {
      return response.status(400).send('invalid request');
    }
  } catch (error) {
    console.error(error);
    return response.status(400).send('invalid request');
  }
}

async function processComponent(body: DiscordInteraction, request: ParsedRequest, response: CraftedResponse) {
  const customId = body.data.custom_id ?? '';
  const handler = ComponentHandlers.find((c) => customId === c.custom_id || customId.startsWith(`${c.custom_id}:`));
  if (!handler) return response.status(400).send('invalid request');

  const user = (body.member?.user || body.user) as User;
  const context: Context = { env: request.env };

  try {
    return await handler.handler(context, body, user, response);
  } catch (error) {
    console.error(error);
    return response.status(400).send('invalid request');
  }
}

async function processModal(body: DiscordInteraction, request: ParsedRequest, response: CraftedResponse) {
  const customId = body.data.custom_id ?? '';
  const handler = ModalHandlers.find((m) => customId === m.custom_id || customId.startsWith(`${m.custom_id}:`));
  if (!handler) return response.status(400).send('invalid request');

  const user = (body.member?.user || body.user) as User;
  const context: Context = { env: request.env, waitUntil: request.waitUntil };

  try {
    return await handler.handler(context, body, user, response);
  } catch (error) {
    console.error(error);
    return response.status(400).send('invalid request');
  }
}

export async function Interaction(request: ParsedRequest<{ Body: DiscordInteraction }>, response: CraftedResponse) {
  switch (request.body.type) {
    case 1: {
      return response.status(200).send({ type: 1 });
    }
    case 2: {
      try {
        return processCommand(request.body.data.name, request.body, request, response);
      } catch (error: any) {
        return response.status(400).send(error.toString());
      }
    }
    case 3: {
      try {
        return processComponent(request.body, request, response);
      } catch (error: any) {
        return response.status(400).send(error.toString());
      }
    }
    case 5: {
      try {
        return processModal(request.body, request, response);
      } catch (error: any) {
        return response.status(400).send(error.toString());
      }
    }
    default: {
      return response.status(400).send('invalid request');
    }
  }
}
