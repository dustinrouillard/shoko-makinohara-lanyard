export {};

declare global {
  const DISCORD_PUBLIC_KEY: string;
  const INTERNAL_TOKEN: string;
  const DISCORD_TOKEN: string;
  const GUILD_ID: string;

  const PROMETHEUS_ENDPOINT: string;
  const PROMETHEUS_USERNAME: string;
  const PROMETHEUS_PASSWORD: string;

  const Storage: KVNamespace;
}
