export interface User {
  avatar: string;
  discriminator: string;
  id: string;
  public_flags: number;
  username: string;
  accent_color: string;
  banner_color: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  proxy_url?: string;
  content_type?: string;
  size: number;
}

export interface EmbedImage {
  url: string;
  proxy_url?: string;
}

export interface MessageEmbed {
  type?: string;
  url?: string;
  image?: EmbedImage;
  thumbnail?: EmbedImage;
}

export interface MessageAuthor {
  id: string;
  bot?: boolean;
  username?: string;
}

export interface Message {
  id: string;
  content: string;
  attachments?: Attachment[];
  embeds?: MessageEmbed[];
  author?: MessageAuthor;
}

export interface Member {
  id: string;
  roles: string[];
}
