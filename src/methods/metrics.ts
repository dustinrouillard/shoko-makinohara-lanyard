import { CraftedResponse, ParsedRequest } from '../types/Routes';
import { getValue, getValueIncrease } from '../utils/metrics';

export async function Metrics(request: ParsedRequest, response: CraftedResponse) {
  try {
    const monitored_users = await getValue('lanyard_monitored_users', request.env);
    const connected_sessions = await getValue('lanyard_connected_sessions', request.env);
    const presence_updates_hour = await getValueIncrease('lanyard_presence_updates', '1h', request.env);

    return response.status(200).send({ monitored_users, connected_sessions, presence_updates_hour });
  } catch (error) {
    console.error(error);
    return response.status(500).send();
  }
}
