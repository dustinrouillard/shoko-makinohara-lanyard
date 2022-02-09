export interface LanyardData {
  success: boolean;
  data: Data;
}

export interface Data {
  spotify: Spotify;
  listening_to_spotify: boolean;
  kv: { [key: string]: string }[];
  discord_user: DiscordUser;
  discord_status: string;
  activities: Activity[];
  active_on_discord_web: boolean;
  active_on_discord_mobile: boolean;
  active_on_discord_desktop: boolean;
}

export interface Activity {
  type: number;
  state: string;
  name: string;
  id: string;
  emoji?: Emoji;
  created_at: number;
  timestamps?: Timestamps;
  sync_id?: string;
  session_id?: string;
  party?: Party;
  flags?: number;
  details?: string;
  assets?: Assets;
  buttons?: string[];
  application_id?: string;
}

export interface Assets {
  large_text: string;
  large_image: string;
  small_text?: string;
  small_image?: string;
}

export interface Emoji {
  name: string;
  id: string;
  animated: boolean;
}

export interface Party {
  id: string;
}

export interface Timestamps {
  start: number;
  end?: number;
}

export interface DiscordUser {
  username: string;
  public_flags: number;
  id: string;
  discriminator: string;
  avatar: string;
}

export interface Spotify {
  track_id: string;
  timestamps: Timestamps;
  song: string;
  artist: string;
  album_art_url: string;
  album: string;
}
