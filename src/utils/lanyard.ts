import { LanyardData } from "../types/Lanyard";

export async function fetchLanyardUser(id: string): Promise<Partial<LanyardData> | null> {
  const data = await fetch(`https://api.lanyard.rest/v1/users/${id}`).then(r => r.json<LanyardData>());
  if (!data.success) return null;

  return data;
}