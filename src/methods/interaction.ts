import { Commands } from '../commands';
import { DiscordInteraction } from '../types/Discord';
import { CraftedResponse, ParsedRequest } from '../types/Routes';

export async function Interaction(request: ParsedRequest<{ Body: DiscordInteraction }>, response: CraftedResponse) {
  switch (request.body.type) {
    case 1: {
      return response.status(200).send({ type: 1 });
    }
    case 2: {
      const command = Commands.find((cmd) => cmd.command == request.body.data.name);
      if (!command) return response.status(400).send('invalid command');

      return command.function(request.body, response);
    }
    default: {
      return response.status(400).send('invalid request');
    }
  }
}
