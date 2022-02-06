import { CraftedResponse, ParsedRequest } from '../types/Routes';

export async function Base(request: ParsedRequest, response: CraftedResponse) {
  return response.status(200).send({ working: true });
}
