export interface DiscordInteraction {
  application_id: string;
  channel_id: string;
  data: Data;
  guild_id: string;
  guild_locale: string;
  id: string;
  locale: string;
  member: Member;
  token: string;
  type: number;
  version: number;
}

export interface Data {
  id: string;
  name: string;
  type: number;
  options?: CommandOptions[];
}

export interface CommandOptions {
  name: string;
  type: number;
  value: string;
}

export interface Member {
  avatar: null;
  communication_disabled_until: null;
  deaf: boolean;
  is_pending: boolean;
  joined_at: string;
  mute: boolean;
  nick: null;
  pending: boolean;
  permissions: string;
  premium_since: null;
  roles: string[];
  user: User;
}

export interface User {
  avatar: string;
  discriminator: string;
  id: string;
  public_flags: number;
  username: string;
}
