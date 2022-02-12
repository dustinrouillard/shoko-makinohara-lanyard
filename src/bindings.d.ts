export {};

declare global {
  const DISCORD_PUBLIC_KEY: string;
  const INTERNAL_TOKEN: string;

  const Storage: KVNamespace;
}
