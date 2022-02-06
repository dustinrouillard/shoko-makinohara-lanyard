import { sign } from 'tweetnacl';
import { CraftedResponse, ParsedRequest } from '../types/Routes';

export async function Verification(request: ParsedRequest, response: CraftedResponse) {
  const signature = request.headers['x-signature-ed25519'];
  const timestamp = request.headers['x-signature-timestamp'];

  if (!signature || !timestamp || !request.body) return response.status(400).send('invalid request');

  const body = JSON.stringify(request.body);

  const isVerified = sign.detached.verify(Buffer.from(timestamp + body), Buffer.from(signature, 'hex'), Buffer.from(DISCORD_PUBLIC_KEY, 'hex'));
  if (!isVerified) return response.status(401).send('invalid request signature');

  return isVerified;
}
