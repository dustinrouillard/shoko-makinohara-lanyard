import { Commands } from '../commands';

export async function trackCommand(name: string) {
  let current = Number(await Storage.get(`stats/commands:${name}`));
  if (!current) current = 1;
  else current = current + 1;

  await Storage.put(`stats/commands:${name}`, current.toString());
  return current;
}

export async function getCommandStats(name: string): Promise<number> {
  const current = Number(await Storage.get(`stats/commands:${name}`)) || 0;
  return current;
}

export async function getAllStats(): Promise<{ name: string; stat: number }[]> {
  const cmds: { name: string; stat: number }[] = [];
  for await (const cmd of Commands) {
    if (typeof cmd.command == 'object') for await (const name of cmd.command) cmds.push({ name, stat: await getCommandStats(name) });
    else cmds.push({ name: cmd.command, stat: await getCommandStats(cmd.command) });
  }
  return cmds;
}
