import { CraftedResponse } from './types/Routes';
import { fetchLanyardUser } from './utils/lanyard';
import { pullLanyardReadme } from './utils/github';
import { Component, ComponentType, Embed, MessageFlags } from './types/Message';
import { DiscordInteraction, User } from './types/Interaction';
import { getAllStats, getGuildStats, trackCommand } from './utils/stats';
import { msToMinSeconds } from './utils/time';
import { getValue, getValueIncrease } from './utils/metrics';
import { getDiscordUser, getLanyardMember, idToTimestamp } from './utils/discord';

export interface Command {
  command: string | string[];
  description: string;
  content?: string;
  ephemeral?: boolean;
  post_channels?: string[];
  prehandler?: (body: DiscordInteraction, user: User) => Record<string, any> | Promise<Record<string, any>>;
  embed?: (context: Record<string, any>, body: DiscordInteraction, user: User) => Partial<Embed> | Promise<Partial<Embed>>;
  components?: (context: Record<string, any>, body: DiscordInteraction, user: User) => Partial<Component[]> | Promise<Partial<Component[]>>;
  function?: (context: Record<string, any>, body: DiscordInteraction, user: User, response: CraftedResponse) => Promise<void>;
}

export const Commands: Command[] = [
  {
    command: 'help',
    description: 'Returns list of commands',
    embed: () => ({
      title: 'Shoko Makinohara Help',
      description: `Commands\n${Commands.map(
        (command) => `${typeof command.command == 'string' ? `\`/${command.command}\`` : `${command.command.map((name) => `\`/${name}\``).join(', ')}`} - ${command.description}`,
      ).join('\n')}`,
      color: 0xef2123,
    }),
  },
  {
    command: 'user',
    description: 'Returns your Discord User ID',
    embed: (context: Record<string, any>, body: DiscordInteraction, user: User) => ({
      title: 'Discord User ID',
      description: `Your Discord User ID is \`${user.id}\`\n\nLanyard API URL\n[api.lanyard.rest/v1/users/${user.id}](https://api.lanyard.rest/v1/users/${user.id})`,
      color: 0x272783,
    }),
  },
  {
    command: 'who',
    description: 'Returns your Lanyard/Discord user info',
    post_channels: ['911712979291086919', '927757958010503171'],
    prehandler: async (body: DiscordInteraction, user: User) => {
      const id = body.data.options?.find((item) => item.name == 'user')?.value || user.id;
      const lanyard = await fetchLanyardUser(id);
      const discord = await getDiscordUser(id);

      if (!lanyard || !discord)
        return {
          title: 'Lanyard Whois',
          description: 'User is not in the Lanyard server\n\nJoin here [discord.gg/lanyard](https://discord.gg/lanyard)',
          color: 0x726311,
        };

      const member = await getLanyardMember(id);
      const joined = new Date(member.joined_at).getTime();

      return {
        joined,
        member,
        lanyard,
        discord,
        id,
      };
    },
    components: (context: Record<string, any>) => {
      const { discord } = context;

      return [
        {
          type: ComponentType.Button,
          style: 5,
          label: 'API',
          emoji: {
            id: '915314938631835709',
          },
          url: `https://api.lanyard.rest/v1/users/${discord.id}`,
        },
      ];
    },
    embed: async (context: Record<string, any>, body: DiscordInteraction, user: User) => {
      const { joined, lanyard, discord } = context;

      try {
        return {
          title: 'Lanyard Whois',
          author: {
            name: `${discord.username}#${discord.discriminator}`,
            icon_url: `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}`,
          },
          footer: { text: `ID: ${discord.id}` },
          fields: [
            {
              name: '⏲️ Monitored Since',
              value: `<t:${(joined - (joined % 1000)) / 1000}>`,
              inline: true,
            },
            {
              name: '☀️ Account Creation',
              value: `<t:${~~(idToTimestamp(discord.id as string).getTime() / 1000)}>`,
              inline: true,
            },
            {
              name: '<:tag:915314938631835709> Lanyard API URL',
              value: `[\`api.lanyard.rest/v1/users/${discord.id}\`](https://api.lanyard.rest/v1/users/${discord.id})`,
            },
            {
              name: '🔑 K/V Keys',
              value: `\`\`\`json\n${Object.keys(lanyard?.data?.kv || {}).join(', ') || 'None'}\n\`\`\``,
            },
            {
              name: '🗒️ Note (kv.note)',
              value: `\`\`\`json\n${lanyard?.data?.kv.note || 'None'}\n\`\`\``,
            },
          ],
          thumbnail: {
            url: `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}`,
          },
          color: parseInt(discord.banner_color || '#63723d', 16),
        };
      } catch (error: any) {
        return {
          title: 'Lanyard Whois',
          description: 'Failed to lookup Lanyard user, try again later',
          color: 0x726311,
        };
      }
    },
  },
  {
    command: 'kv',
    post_channels: ['911712979291086919', '927757958010503171'],
    description: 'Returns users Lanyard K/V pairs',
    embed: async (context: Record<string, any>, body: DiscordInteraction, user: User) => {
      const id = body.data.options?.find((item) => item.name == 'user')?.value || user.id;
      const lanyard = await fetchLanyardUser(id);
      return {
        title: `Lanyard K/V for ${lanyard?.data?.discord_user.username}#${lanyard?.data?.discord_user.discriminator}`,
        description: `Current Lanyard K/V Items\n\n\`\`\`json\n${
          lanyard?.data?.kv ? JSON.stringify(lanyard.data.kv, null, 2) : '{}'
        }\n\`\`\`\nTo access a key within a script, pull your Lanyard object [\`api.lanyard.rest/v1/users/${id}\`](https://api.lanyard.rest/v1/users/${id})\nand the json path is\`.data.kv.KEY_NAME\`\nwhen using the socket it will be \`.d.kv.KEY_NAME\`\nThe \`.\` referencing the root of your JSON response\n\nYou can set K/V items by reading the help with \`.kv\``,
        color: 0xff9823,
      };
    },
  },
  {
    command: 'kvapi',
    description: "Returns information about interacting with Lanyard's K/V with the API",
    embed: (context: Record<string, any>, body: DiscordInteraction, user: User) => ({
      title: 'Lanyard K/V API',
      description: `Lanyard has the ability to keep track of K/V pairs on your Lanyard object that is returned from the API, and will also send updates to them over the socket just like your discord presence data.\n\nFirst you'll need an API key which you can get by going to DM's with <@819287687121993768> and sending \`.apikey\`\n\nThen you can use the following route structure to manipulate and set K/V pairs\n\nAdding/changing a key: \`PUT /v1/users/${user.id}/kv/:key\`\n[*The body will be used as the value*](https://dustin.pics/d934048c87b6eb73.png)\n\nDeleing a key: \`DELETE /v1/users/${user.id}/kv/:key\`\n\nBoth of these routes will require an \`Authorization\` header containing your api key which you got eariler.`,
      color: 0xfeb321,
    }),
  },
  {
    command: 'metrics',
    description: 'Returns various metrics from Lanyard',
    embed: async (context: Record<string, any>, body: DiscordInteraction) => {
      try {
        const monitored_users = await getValue('lanyard_monitored_users');
        const connected_sessions = await getValue('lanyard_connected_sessions');
        const presence_updates_hour = await getValueIncrease('lanyard_presence_updates', '1h');

        return {
          title: 'Lanyard Metrics',
          fields: [
            {
              name: 'Monitored Users',
              value: monitored_users.toLocaleString(),
            },
            {
              name: 'Connected Socket Clients',
              value: connected_sessions.toLocaleString(),
            },
            {
              name: 'Presence Updates (1 hour)',
              value: presence_updates_hour.toLocaleString(),
            },
          ],
          color: 0xbe2cbe,
        };
      } catch (error) {
        console.error(error);
        return {
          title: 'Failed',
          description: 'failed to run command',
        };
      }
    },
  },
  {
    command: 'socket',
    description: 'Returns information about using the Lanyard socket',
    embed: (context: Record<string, any>, body: DiscordInteraction, user: User) => ({
      title: 'Lanyard K/V API',
      description: `The socket is best way to implement Lanyard\n\n**Opcodes**\n*0*: \`Event\`\n*1*: \`Hello\`\n*2*: \`Initialize\`\n*3*: \`Heartbeat\`\n\n**Sending the heartbeat**\nAfter you connect to the socket you should listen for \`OP 1\` which will contain the \`d\` object that looks like this.\n\`\`\`json\n{\n  "op":1,\n  "d":{\n    "heartbeat_interval":30000\n  }\n}\n\`\`\`\nYou'll want to use the \`heartbeat_interval\` property and send \`OP 3\` on this interval like so. \`{"op":3}\`\n\nAfter we've established sending our heartbeat, you'll want to send \`OP 2\` initialize to subscribe to presence events for your user, a list of users, or every user lanyard monitors.\n\n*Just one*: \`{"op":2,"d":{"subscribe_to_id":"ID"}}\`\n*Multiple*: \`{"op":2,"d":{"subscribe_to_ids":["ID","ID"]}}\`\n*All*: \`{"op":2,"d":{"subscribe_to_all":true}}\`\n\nYou will receive an event on \`OP 0\` which has a property called \`t\` which has the following events\n- \`INIT_STATE\`\n- \`PRESENCE_UPDATE\`\n\nOnce you send the subscribe data you will get \`OP 0\`, \`INIT_STATE\` which conatins the initial presence data of the users you subscribed to in one of two formats.\n\n**If you subscribed to one user**:\n\`\`\`json\n{\n  "op":0,\n  "t":"INIT_STATE",\n  "d":{\n    ...presence data\n  }\n}\n\`\`\`\n**If you subscribed to multiple users or all**:\n\`\`\`json\n{\n  "op":0,\n  "t":"INIT_STATE",\n  "d":{\n    "ID":{\n      ...presence data\n    }\n  }\n}\n\`\`\`\n\nYou then will receive \`OP 0\`, \`PRESENCE_UPDATE\` when any user you're subscribed to has a presence update.\n\`\`\`json\n{\n  "op":0,\n  "t":"PRESENCE_UPDATE",\n  "d":{\n    ...presence data\n  }\n}\n\`\`\`\n\n[Example in javascript](https://gist.github.com/dustinrouillard/2b2a2f7f18be5690f0c487c8a16fa707).`,
      color: 0xabe221,
    }),
  },
  {
    command: 'react',
    description: 'Usage instructions for React',
    embed: (context: Record<string, any>, body: DiscordInteraction, user: User) => ({
      title: 'Usage with React',
      description: `Using Lanyard with a React site can be done in many different ways, but the easiest way would be to use the hook <@268798547439255572> made\n[use-lanyard](https://github.com/alii/use-lanyard)\n\n**Usage examples for the use-lanyard hook**\n\nUsing SWR (HTTP Polling):\n\`\`\`js\nimport { useLanyard } from 'use-lanyard';\n\nconst DISCORD_ID = '${user.id}';\n\nexport function Activity() {\n  const { data: activity } = useLanyard(DISCORD_ID);\n\n  return <>...</>;\n}\n\`\`\`\nUsing the socket **(Recommended)**\`\`\`js\nimport { useLanyardWs } from 'use-lanyard';\n\nconst DISCORD_ID = '${user.id}';\n\nexport function Activity() {\n  const activity = useLanyardWs(DISCORD_ID);\n\n  return <>...</>;\n}\n\`\`\`\nThis gives you the raw Lanyard API data as an object, meaning you can create a component for any of the data that Lanyard returns and it'll be always up to date with your presence data from discord.`,
      color: 0x61dbfb,
    }),
  },
  {
    command: 'assets',
    description: 'Learn how to handle various assets',
    embed: async (_, user) => ({
      title: 'Discord Assets',
      description: `Discord returns various things for their assets, however they're easy to convert to the cdn url so you can use them.\nYou can also read the discord developer docs page for [image formatting](https://discord.com/developers/docs/reference#image-formatting).\n\n**Avatars**\nThe API returns the hash of the avatar, which you have to combine with the ID to get the image URL\n\`https://cdn.discordapp.com/avatars/<USER_ID>/<HASH>\`\n\n**Activity Icons**\nActivity icons vary a little bit, for most of them they don't have a hash, and you can use the following structure\n\`https://cdn.discordapp.com/app-icons/<APP_ID>/<ASSET_ID>\`\n\nFor some activities that don't have an assets object (These are normally manually added games or games without rich presences) they don't have an easy way without a third party service to get their asset hash, however <@156114103033790464> has made a worker for this, and you can learn about it by running \`/banners\` or [here](https://dcdn.dstn.to/gist)\n\nFor all of these you can include a file extension \`.png .webp .gif .jpeg\` and or a \`size\` query param\n*Example: \`https://cdn.discordapp.com/avatars/${
        user.id
      }/${(await fetchLanyardUser(user.id))?.data?.discord_user.avatar}.png?size=512\`*`,
      color: 0x647322,
    }),
  },
  {
    command: 'spotify',
    description: 'Returns information about spotify data from Lanyard',
    embed: async (context: Record<string, any>, body: DiscordInteraction, user: User) => {
      const lanyard = await fetchLanyardUser(user.id);
      const currentTime = new Date().getTime();

      return {
        title: 'Lanyard K/V API',
        description: `**Calculating current position and song length using the data timestamps provided by your Lanyard data**\n\nAll you have to do is a bit of math\n\`spotify.timestamps.end - spotify.timestamps.start\` = song length\n\`currentTimeInMs - spotify.timestamps.start\` = current position\n\nThese values are in milliseconds so you'll need to convert them using more math, example for calculating this in javascript seen [here](https://gist.github.com/dustinrouillard/8140fd47c5900d4421637b098b6d92c0)${
          lanyard?.data?.spotify
            ? `\n\n**Your current listening data**\n\`${lanyard.data.spotify.song} by ${lanyard.data.spotify.artist}\`\n\`Time: ${msToMinSeconds(
                currentTime - lanyard.data.spotify.timestamps.start,
              )} - ${msToMinSeconds((lanyard.data.spotify.timestamps.end || 0) - lanyard.data.spotify.timestamps.start)}\``
            : '\n\n*Start listening to music to see the timestamps here*'
        }`,
        color: 0xb21332,
      };
    },
  },
  {
    command: 'cards',
    description: 'Returns Lanyard visualizer/card contributions from the community',
    embed: async (context: Record<string, any>, body: DiscordInteraction, user: User) => {
      const lanyardProfileReadmeUsers: { count: number } = await fetch('https://lanyard.cnrad.dev/api/getUserCount').then((r) => r.json());
      return {
        title: 'Lanyard Cards and Visualizers',
        description: `Here are the links to some Lanyard visualizers and direct links to your lanyard profile on them\n\n[Lanyard Profile Readme by cnrad](https://github.com/cnrad/lanyard-profile-readme) | [View Card](https://lanyard.cnrad.dev/api/${
          user.id
        }) \`Used by : ${lanyardProfileReadmeUsers.count.toLocaleString()} users\`\n[Lanyard Visualizer by EGGSY](https://github.com/eggsy/lanyard-visualizer) | [View Card](https://lanyard-visualizer.netlify.app/user/${
          user.id
        })\n\n*If there are any other visualizers you want added to this list let <@156114103033790464> know.*`,
        color: 0x893012,
      };
    },
  },
  {
    command: 'projects',
    description: 'Returns community projects that were created around Lanyard',
    embed: async () => ({
      title: 'Lanyard Community Projects',
      description: `The Lanyard community has worked on some pretty cool projects that allows you to extend the functionality of Lanyard. [PR to add a project](https://github.com/Phineas/lanyard)!\n\n${(
        await pullLanyardReadme()
      ).communityProjects
        .map((item) => `${item.link}\n${item.description}`)
        .join('\n\n')}`,
      color: 0x392812,
    }),
  },
  {
    command: 'websites',
    description: 'Returns a list of websites which implement Lanyard',
    embed: async () => ({
      title: 'Websites that use Lanyard',
      description: `Below is a list of sites using Lanyard right now, check them out! A lot of them will only show an activity when they're active. [Create a PR to add your site](https://github.com/Phineas/lanyard)!\n\n${(
        await pullLanyardReadme()
      ).websites.join('\n')}`,
      color: 0x298938,
    }),
  },
  {
    command: 'source',
    description: 'Returns repository for this bots source',
    embed: () => ({
      title: 'Shoko Makinohara Source',
      description: `This bot runs via a cloudflare worker, the source can be found on my github [here](https://github.com/dustinrouillard/shoko-makinohara-lanyard)`,
      color: 0x298938,
    }),
  },
  {
    command: 'invite',
    description: 'Returns bot invite for Shoko Makinohara',
    embed: () => ({
      title: 'Invite Shoko Makinohara',
      description: `You can invite this bot to your server if you want, hopefully in the future it'll be able to do more cool things with Lanyard, such as manging the K/V`,
      color: 0x298938,
    }),
    components: () => [
      {
        type: ComponentType.Button,
        style: 5,
        label: 'Invite Bot',
        url: 'https://discord.com/api/oauth2/authorize?client_id=911655061594202192&permissions=0&scope=applications.commands%20bot',
      },
    ],
  },
  {
    command: 'stats',
    description: 'Shoko Makinohara Statistics',
    embed: async () => ({
      title: 'Shoko Makinohara Stats',
      footer: { text: `Working in ${(await getGuildStats()).toLocaleString()} guilds` },
      description: `Current command usage statistics\n\n${(await getAllStats()).map((cmd) => `\`/${cmd.name}\` - **${cmd.stat.toLocaleString()}**`).join('\n')}`,
      color: 0x849203,
    }),
  },
  {
    command: ['banners', 'bios'],
    description: 'Information about banners/bios',
    embed: () => ({
      title: 'Getting banners or bios',
      description: `**Bios**\nDiscord doesn't return bio in presence data for anyone, or in the API to bots for privacy reasons\n\n**Banners**\nDiscord doesn't return the banner for the user in the presence data, but they do return it in the API for bots\n\nHowever these limitations can be bypassed on a per-use basis using an api that [Dustin](https://twitter.com/dustinrouillard) made [dcdn worker](https://dcdn.dstn.to/gist)\n*This cannot 100% reliable for the user profile as it's not using an officially supported method*`,
      color: 0x102392,
    }),
  },
];

export async function processCommand(name: string, body: DiscordInteraction, response: CraftedResponse) {
  const command = Commands.find((cmd) => (typeof cmd.command == 'object' ? cmd.command.includes(name) : cmd.command == name));
  if (!command) return response.status(400).send('invalid request');

  await trackCommand(name);

  const ephemeral = typeof command.ephemeral == 'undefined' || command.ephemeral;
  const post_channel = command.post_channels && command.post_channels.includes(body.channel_id);
  const flags = post_channel || !body.channel_id ? null : ephemeral ? MessageFlags.Ephemeral : null;

  const user = (body.member?.user || body.user) as User;

  let context = {};
  if (command.prehandler) context = await command.prehandler(body, user);

  const components = command.components ? [{ type: 1, components: await command.components(context, body, user) }] : undefined;

  if (command.function) {
    return await command.function(context, body, user, response);
  } else if (command.embed) {
    return response.status(200).send({
      type: 4,
      data: {
        flags,
        content: command.content,
        embeds: [await command.embed(context, body, user)],
        components,
      },
    });
  } else if (command.content) {
    return response.status(200).send({
      type: 4,
      data: {
        flags,
        content: command.content,
        components,
      },
    });
  } else {
    return response.status(400).send('invalid request');
  }
}
