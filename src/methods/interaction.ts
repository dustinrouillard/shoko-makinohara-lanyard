import { processCommand } from '../commands';
import { DiscordInteraction } from '../types/Interaction';
import { CraftedResponse, ParsedRequest } from '../types/Routes';

export async function Interaction(request: ParsedRequest<{ Body: DiscordInteraction }>, response: CraftedResponse) {
  switch (request.body.type) {
    case 1: {
      return response.status(200).send({ type: 1 });
    }
    case 2: {
      return processCommand(request.body.data.name, request.body, response);
    }
    default: {
      return response.status(400).send('invalid request');
    }
  }
}
