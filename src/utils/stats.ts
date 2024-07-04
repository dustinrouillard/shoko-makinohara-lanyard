import { Commands } from '../commands';
import { Env } from '../types/Routes';

export async function trackCommand(name: string, env: Env) {
  let current = Number(await env.Storage.get(`stats/commands:${name}`));
  if (!current) current = 1;
  else current = current + 1;

  await env.Storage.put(`stats/commands:${name}`, current.toString());
  return current;
}

export async function getCommandStats(name: string, env: Env): Promise<number> {
  const current = Number(await env.Storage.get(`stats/commands:${name}`)) || 0;
  return current;
}

export async function getAllStats(env: Env): Promise<{ name: string; stat: number }[]> {
  const cmds: { name: string; stat: number }[] = [];
  for await (const cmd of Commands) {
    if (typeof cmd.command == 'object') for await (const name of cmd.command) cmds.push({ name, stat: await getCommandStats(name, env) });
    else cmds.push({ name: cmd.command, stat: await getCommandStats(cmd.command, env) });
  }
  return cmds;
}

export async function getGuildStats(env: Env): Promise<number> {
  const current = Number(await env.Storage.get(`stats/guilds`)) || 0;
  return current;
}

export async function trackNewGuild(env: Env): Promise<number> {
  let current = Number(await env.Storage.get(`stats/guilds`));
  if (!current) current = 1;
  else current = current + 1;

  await env.Storage.put(`stats/guilds`, current.toString());
  return current;
}

export async function trackLostGuild(env: Env): Promise<number> {
  let current = Number(await env.Storage.get(`stats/guilds`));
  if (!current) current = 0;
  else current = current - 1;

  await env.Storage.put(`stats/guilds`, current.toString());
  return current;
}
