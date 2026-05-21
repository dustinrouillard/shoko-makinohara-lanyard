import { Env } from '../types/Routes';

export enum EventType {
  UserMuted,
  UserUnmuted,
  UserSupportMuted,
  UserSupportUnmuted,
  UserOpped,
  UserDeopped,
}

const eventTitle = {
  [EventType.UserMuted]: 'User restricted from chat',
  [EventType.UserUnmuted]: 'User unrestricted from chat',
  [EventType.UserSupportMuted]: 'User restricted from support chats',
  [EventType.UserSupportUnmuted]: 'User unrestricted from support chats',
  [EventType.UserOpped]: 'User was opped',
  [EventType.UserDeopped]: 'User was deopped',
};

const eventColors = {
  [EventType.UserMuted]: 0xef4444,
  [EventType.UserUnmuted]: 0x10b981,
  [EventType.UserSupportMuted]: 0xdc2626,
  [EventType.UserSupportUnmuted]: 0x34d399,
  [EventType.UserOpped]: 0xf59e0b,
  [EventType.UserDeopped]: 0xd97706,
};

export async function sendPhashReportEvent(
  env: Env,
  data: { actor: string; message_link: string; type: string; reason: string; added: number; duplicates: number; errors: number; deleted: boolean },
) {
  const embed = {
    title: 'Images reported to pHash automod',
    color: 0x6366f1,
    fields: [
      { name: 'Actor', value: `<@${data.actor}>`, inline: true },
      { name: 'Type', value: `\`${data.type}\``, inline: true },
      { name: 'Added / Duplicates / Errors', value: `${data.added} / ${data.duplicates} / ${data.errors}`, inline: true },
      { name: 'Message', value: `${data.message_link}${data.deleted ? ' (deleted)' : ''}` },
      { name: 'Reason', value: data.reason },
    ],
  };

  await fetch(env.EVENT_LOG_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
}

export async function sendUserEvent(env: Env, type: EventType, data: { actor: string; target: string }) {
  const embed = {
    title: eventTitle[type],
    color: eventColors[type],
    fields: [
      {
        name: 'User',
        value: `<@${data.target}>`,
        inline: true,
      },
      {
        name: 'Actor',
        value: `<@${data.actor}>`,
        inline: true,
      },
    ],
  };

  const response = await fetch(env.EVENT_LOG_WEBHOOK, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ embeds: [embed] }),
  });

  return;
}
