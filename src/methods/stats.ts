import { CraftedResponse, ParsedRequest } from '../types/Routes';
import { getAllStats, getCommandStats, getErrorStats, getEventLogStats, getModStats, getServiceErrorStats, trackLostGuild, trackNewGuild } from '../utils/stats';

export async function AllStats(request: ParsedRequest, response: CraftedResponse) {
  const stats = await getAllStats(request.env);
  return response.status(200).send(stats);
}

export async function ModStats(request: ParsedRequest, response: CraftedResponse) {
  const stats = await getModStats(request.env);
  return response.status(200).send(stats);
}

export async function ErrorStats(request: ParsedRequest, response: CraftedResponse) {
  const [handlers, services] = await Promise.all([getErrorStats(request.env), getServiceErrorStats(request.env)]);
  return response.status(200).send({ handlers, services });
}

export async function EventLogStats(request: ParsedRequest, response: CraftedResponse) {
  const stats = await getEventLogStats(request.env);
  return response.status(200).send(stats);
}

function promLine(name: string, labels: Record<string, string>, value: number) {
  const rendered = Object.entries(labels)
    .map(([key, label]) => `${key}="${label.replace(/(["\\])/g, '\\$1')}"`)
    .join(',');
  return rendered ? `${name}{${rendered}} ${value}` : `${name} ${value}`;
}

export async function PrometheusStats(request: ParsedRequest, response: CraftedResponse) {
  const list = await request.env.Storage.list({ prefix: 'stats/' });
  const entries = await Promise.all(
    list.keys.map(async (key: { name: string }) => ({ key: key.name.slice('stats/'.length), value: Number(await request.env.Storage.get(key.name)) || 0 })),
  );

  const families: Record<string, { type: string; help: string; lines: string[] }> = {
    shoko_commands_total: { type: 'counter', help: 'Slash and context-menu command invocations, by command.', lines: [] },
    shoko_interactions_total: { type: 'counter', help: 'Component clicks and modal submits, by kind and custom id.', lines: [] },
    shoko_mod_actions_total: { type: 'counter', help: 'Moderation actions performed, by action.', lines: [] },
    shoko_errors_total: { type: 'counter', help: 'Handler errors, by handler.', lines: [] },
    shoko_external_errors_total: { type: 'counter', help: 'External service failures, by service.', lines: [] },
    shoko_eventlog_posts_total: { type: 'counter', help: 'Audit-log embed deliveries, by outcome.', lines: [] },
    shoko_guilds: { type: 'gauge', help: 'Guilds the bot is installed in.', lines: [] },
  };

  for (const { key, value } of entries) {
    if (key.startsWith('commands:')) families.shoko_commands_total.lines.push(promLine('shoko_commands_total', { command: key.slice(9) }, value));
    else if (key.startsWith('interactions:')) {
      const [kind, ...id] = key.slice(13).split(':');
      families.shoko_interactions_total.lines.push(promLine('shoko_interactions_total', { kind, custom_id: id.join(':') }, value));
    } else if (key.startsWith('mod:')) families.shoko_mod_actions_total.lines.push(promLine('shoko_mod_actions_total', { action: key.slice(4) }, value));
    else if (key.startsWith('errors:')) {
      const handler = key.slice(7);
      if (handler !== '_all') families.shoko_errors_total.lines.push(promLine('shoko_errors_total', { handler }, value));
    } else if (key.startsWith('external_errors:')) families.shoko_external_errors_total.lines.push(promLine('shoko_external_errors_total', { service: key.slice(16) }, value));
    else if (key.startsWith('eventlog:')) families.shoko_eventlog_posts_total.lines.push(promLine('shoko_eventlog_posts_total', { outcome: key.slice(9) }, value));
    else if (key === 'guilds') families.shoko_guilds.lines.push(promLine('shoko_guilds', {}, value));
  }

  const body =
    Object.entries(families)
      .filter(([, family]) => family.lines.length)
      .map(([name, family]) => `# HELP ${name} ${family.help}\n# TYPE ${name} ${family.type}\n${family.lines.sort().join('\n')}`)
      .join('\n') + '\n';

  return response.header('content-type', 'text/plain; version=0.0.4').status(200).send(body);
}

export async function CommandStats(request: ParsedRequest<{ Params: { name: string } }>, response: CraftedResponse) {
  const stats = await getCommandStats(request.params.name, request.env);
  return response.status(200).send(stats);
}

export async function TrackGuilds(request: ParsedRequest<{ Params: { type: string } }>, response: CraftedResponse) {
  if (request.params.type == 'join') await trackNewGuild(request.env);
  else if (request.params.type == 'left') await trackLostGuild(request.env);

  return response.status(201).send();
}
