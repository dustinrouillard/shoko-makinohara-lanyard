import { Commands } from '../commands';
import { Env } from '../types/Routes';

async function incrStat(key: string, env: Env): Promise<number> {
  const current = (Number(await env.Storage.get(key)) || 0) + 1;
  await env.Storage.put(key, current.toString());
  return current;
}

async function getStat(key: string, env: Env): Promise<number> {
  return Number(await env.Storage.get(key)) || 0;
}

export async function trackCommand(name: string, env: Env) {
  return incrStat(`stats/commands:${name}`, env);
}

export const MOD_ACTIONS = ['op', 'deop', 'mute', 'support_mute', 'unmute', 'support_unmute', 'kick'] as const;

export async function trackModAction(action: string, env: Env) {
  return incrStat(`stats/mod:${action}`, env);
}

export async function getModStats(env: Env): Promise<{ action: string; stat: number }[]> {
  const out: { action: string; stat: number }[] = [];
  for (const action of MOD_ACTIONS) out.push({ action, stat: await getStat(`stats/mod:${action}`, env) });
  return out;
}

export async function trackError(name: string, env: Env) {
  await incrStat(`stats/errors:_all`, env);
  return incrStat(`stats/errors:${name}`, env);
}

export async function getErrorTotal(env: Env): Promise<number> {
  return getStat(`stats/errors:_all`, env);
}

export async function trackEventLog(outcome: 'success' | 'failure', env: Env) {
  return incrStat(`stats/eventlog:${outcome}`, env);
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
