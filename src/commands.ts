import { CraftedResponse } from './types/Routes';
import { fetchLanyardUser } from './utils/lanyard';
import { pullLanyardReadme } from './utils/github';
import { Component, ComponentType, Embed, MessageFlags } from './types/Message';
import { DiscordInteraction, User } from './types/Interaction';
import { getAllStats, getGuildStats, trackCommand } from './utils/stats';
import { msToMinSeconds } from './utils/time';

export interface Command {
  command: string | string[];
  description: string;
  content?: string;
  ephemeral?: boolean;
  post_channels?: string[];
  embed?: (body: DiscordInteraction, user: User) => Partial<Embed> | Promise<Partial<Embed>>;
  components?: (body: DiscordInteraction, user: User) => Partial<Component[]> | Promise<Partial<Component[]>>;
  function?: (body: DiscordInteraction, user: User, response: CraftedResponse) => Promise<void>;
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
    embed: (body: DiscordInteraction, user: User) => ({
      title: 'Discord User ID',
      description: `Your Discord User ID is \`${user.id}\`\n\nLanyard API URL\n[api.lanyard.rest/v1/users/${user.id}](https://api.lanyard.rest/v1/users/${user.id})`,
      color: 0x272783,
    }),
  },
  {
    command: 'kv',
    post_channels: ['911712979291086919', '927757958010503171'],
    description: 'Returns users Lanyard K/V pairs',
    embed: async (body: DiscordInteraction, user: User) => {
      const id = body.data.options?.find((item) => item.name == 'user')?.value || user.id;
      const lanyard = await fetchLanyardUser(id);
      return {
        title: `Lanyard K/V for ${lanyard?.data?.discord_user.username}#${lanyard?.data?.discord_user.discriminator}`,
        description: `Current Lanyard K/V Items\n\n\`\`\`json\n${
          lanyard?.data?.kv ? JSON.stringify(lanyard.data.kv, null, 2) : '{}'
        }\n\`\`\`\nTo access a key within a script the path is\n\`.data.kv.KEY_NAME\`\n\nYou can set K/V items by reading the help with \`.kv\``,
        color: 0xff9823,
      };
    },
  },
  {
    command: 'kvapi',
    description: "Returns information about interacting with Lanyard's K/V with the API",
    embed: (body: DiscordInteraction, user: User) => ({
      title: 'Lanyard K/V API',
      description: `Lanyard has the ability to keep track of K/V pairs on your Lanyard object that is returned from the API, and will also send updates to them over the socket just like your discord presence data.\n\nFirst you'll need an API key which you can get by going to DM's with <@819287687121993768> and sending \`.apikey\`\n\nThen you can use the following route structure to manipulate and set K/V pairs\n\nAdding/changing a key: \`PUT /v1/users/${user.id}/kv/:key\`\n[*The body will be used as the value*](https://dustin.pics/d934048c87b6eb73.png)\n\nDeleing a key: \`DELETE /v1/users/${user.id}/kv/:key\`\n\nBoth of these routes will require an \`Authorization\` header containing your api key which you got eariler.`,
      color: 0xfeb321,
    }),
  },
  {
    command: 'spotify',
    description: 'Returns information about spotify data from Lanyard',
    embed: async (body: DiscordInteraction, user: User) => {
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
    embed: (body: DiscordInteraction, user: User) => ({
      title: 'Lanyard Cards and Visualizers',
      description: `Here are the links to some Lanyard visualizers and direct links to your lanyard profile on them\n\n[Lanyard Profile Readme by cnrad](https://github.com/cnrad/lanyard-profile-readme) | [Your card](https://lanyard.cnrad.dev/api/${user.id})\n[Lanyard Visualizer by EGGSY](https://github.com/eggsy/lanyard-visualizer) | [Your card](https://lanyard-visualizer.netlify.app/user/${user.id})\n\n*If there are any other visualizers you want added to this list let <@156114103033790464> know.*`,
      color: 0x893012,
    }),
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
  const components = command.components ? [{ type: 1, components: await command.components(body, user) }] : undefined;

  if (command.function) {
    return await command.function(body, user, response);
  } else if (command.embed) {
    return response.status(200).send({
      type: 4,
      data: {
        flags,
        content: command.content,
        embeds: [await command.embed(body, user)],
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
