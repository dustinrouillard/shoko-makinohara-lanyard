import { LanyardData } from '../types/Lanyard';
import { Env } from '../types/Routes';
import { trackServiceError } from './stats';

export async function fetchLanyardUser(id: string, env?: Env): Promise<Partial<LanyardData> | null> {
  try {
    const data = await fetch(`https://api.lanyard.rest/v1/users/${id}`).then((r) => r.json<LanyardData>());
    if (!data.success) return null;

    return data;
  } catch (error) {
    console.error('lanyard api error', error);
    if (env) await trackServiceError('lanyard', env);
    return null;
  }
}
