import { CraftedResponse } from './types/Routes';
import { pullLanyardReadme } from './utils/github';
import { Embed, MessageFlags } from './types/Message';
import { DiscordInteraction } from './types/Interaction';
import { getAllStats, trackCommand } from './utils/stats';
import { fetchLanyardUser } from './utils/lanyard';

export interface Command {
  command: string | string[];
  content?: string;
  embed?: (body: DiscordInteraction) => Partial<Embed> | Promise<Partial<Embed>>;
  function?: (body: DiscordInteraction, response: CraftedResponse) => Promise<void>;
}

export const Commands: Command[] = [
  {
    command: 'user',
    embed: (body: DiscordInteraction) => ({
      title: 'Discord User ID',
      description: `Your Discord User ID is \`${body.member.user.id}\`\n\nLanyard API URL\n[api.lanyard.rest/v1/users/${body.member.user.id}](https://api.lanyard.rest/v1/users/${body.member.user.id})`,
      color: 0x272783,
    }),
  },
  {
    command: 'kv',
    embed: async (body: DiscordInteraction) => {
      const user = body.data.options?.find(item => item.name == 'user')?.value || body.member.user.id;
      const lanyard = await fetchLanyardUser(user);
      return {
        title: `Lanyard K/V for ${lanyard?.data?.discord_user.username}#${lanyard?.data?.discord_user.discriminator}`,
        description: `Current Lanyard K/V Items\n\n\`\`\`json\n${lanyard?.data?.kv ? JSON.stringify(lanyard.data.kv, null, 2) : '{}'}\n\`\`\`\nTo access a key within a script the path is\n\`.data.kv.KEY_NAME\`\n\nYou can set K/V items by reading the help with \`.kv\``,
        color: 0xff9823,
      }
    }
  },
  {
    command: 'cards',
    embed: (body: DiscordInteraction) => ({
      title: 'Lanyard Cards and Visualizers',
      description: `Here are the links to some Lanyard visualizers and direct links to your lanyard profile on them\n\n[Lanyard Profile Readme by cnrad](https://github.com/cnrad/lanyard-profile-readme) | [Your card](https://lanyard.cnrad.dev/api/${body.member.user.id})\n[Lanyard Visualizer by EGGSY](https://github.com/eggsy/lanyard-visualizer) | [Your card](https://lanyard-visualizer.netlify.app/user/${body.member.user.id})\n\n*If there are any other visualizers you want added to this list let <@156114103033790464> know.*`,
      color: 0x893012,
    }),
  },
  {
    command: 'projects',
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
    embed: () => ({
      title: 'Shoko Makinohara Source',
      description: `This bot runs via a cloudflare worker, the source can be found on my github [here](https://github.com/dustinrouillard/shoko-makinohara-lanyard)`,
      color: 0x298938,
    }),
  },
  {
    command: 'stats',
    embed: async () => ({
      title: 'Shoko Makinohara Command Stats',
      description: `Current command usage statistics\n\n${(await getAllStats()).map((cmd) => `\`/${cmd.name}\` - **${cmd.stat.toLocaleString()}**`).join('\n')}`,
      color: 0x849203,
    }),
  },
  {
    command: ['banners', 'bios'],
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

  if (command.function) {
    return await command.function(body, response);
  } else if (command.embed) {
    return response.status(200).send({
      type: 4,
      data: {
        flags: MessageFlags.Ephemeral,
        content: command.content,
        embeds: [await command.embed(body)],
      },
    });
  } else if (command.content) {
    return response.status(200).send({
      type: 4,
      data: {
        flags: MessageFlags.Ephemeral,
        content: command.content,
      },
    });
  } else {
    return response.status(400).send('invalid request');
  }
}
