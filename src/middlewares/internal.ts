import { sign } from 'tweetnacl';
import { CraftedResponse, ParsedRequest } from '../types/Routes';

export async function Internal(request: ParsedRequest, response: CraftedResponse) {
  const token = request.headers.authorization?.replace(/[T|t]oken /g, '');
  if (!token) return response.status(400).send('invalid authentication');

  return token == INTERNAL_TOKEN;
}
