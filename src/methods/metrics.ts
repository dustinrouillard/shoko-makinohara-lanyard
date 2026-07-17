import { CraftedResponse, ParsedRequest } from '../types/Routes';
import { getValue, getValueIncrease } from '../utils/metrics';

function classifyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.startsWith('prometheus_') ? message : 'fetch_failed';
}

export async function Metrics(request: ParsedRequest, response: CraftedResponse) {
  const errors: Record<string, string> = {};
  const attempt = (promise: Promise<number>, key: string) =>
    promise.catch((error) => {
      console.error('metrics upstream error', key, error);
      errors[key] = classifyError(error);
      return null;
    });

  const [monitored_users, connected_sessions, presence_updates_hour] = await Promise.all([
    attempt(getValue('lanyard_monitored_users', request.env), 'monitored_users'),
    attempt(getValue('lanyard_connected_sessions', request.env), 'connected_sessions'),
    attempt(getValueIncrease('lanyard_presence_updates', '1h', request.env), 'presence_updates_hour'),
  ]);

  if (monitored_users === null && connected_sessions === null && presence_updates_hour === null)
    return response.status(502).send({ code: 'prometheus_unreachable', errors });

  return response.status(200).send({ monitored_users, connected_sessions, presence_updates_hour });
}
