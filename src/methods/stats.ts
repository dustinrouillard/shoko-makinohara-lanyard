import { CraftedResponse, ParsedRequest } from '../types/Routes';
import { getAllStats, getCommandStats } from '../utils/stats';

export async function AllStats(request: ParsedRequest, response: CraftedResponse) {
  const stats = await getAllStats();
  return response.status(200).send(stats);
}

export async function CommandStats(request: ParsedRequest<{ Params: { name: string } }>, response: CraftedResponse) {
  const stats = await getCommandStats(request.params.name);
  return response.status(200).send(stats);
}
