export enum MessageFlags {
  Crossposted = 1 << 0,
  IsCrosspost = 1 << 1,
  SuppressEmbeds = 1 << 2,
  SourceMessageDeleted = 1 << 3,
  Urgent = 1 << 4,
  Ephemeral = 1 << 6,
  Loading = 1 << 7,
}

export interface DiscordMessage {
  content?: string;
  embeds?: Embed[];
  flags?: MessageFlags;
}

export interface Embed {
  title: string;
  description: string;
  url: string;
  color: number;
  timestamp: string;
  footer: Footer;
  thumbnail: Image;
  image: Image;
  author: Author;
  fields: Field[];
}

export interface Author {
  name?: string;
  url?: string;
  icon_url?: string;
}

export interface Field {
  name: string;
  value: string;
  inline?: boolean;
}

export interface Footer {
  icon_url?: string;
  text?: string;
}

export interface Image {
  url: string;
}

export enum ComponentType {
  ActionRow = 1,
  Button = 2,
  SelectMenu = 3,
  TextInput = 4,
}

export interface MessageComponent {
  type: ComponentType;
  components: Component[];
}

export interface Emoji {
  id?: string;
  name?: string;
}

export interface Component {
  type: ComponentType;
  label: string;
  style: number;
  custom_id?: string;
  url?: string;
  emoji?: Emoji;
}
