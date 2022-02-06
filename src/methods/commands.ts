import { DiscordInteraction } from '../types/Discord';
import { CraftedResponse } from '../types/Routes';
import { pullLanyardReadme } from '../utils/github';

export async function UserCommand(body: DiscordInteraction, response: CraftedResponse) {
  return response.status(200).send({
    type: 4,
    data: {
      flags: 1 << 6,
      embeds: [
        {
          title: 'Discord User ID',
          description: `Your Discord User ID is \`${body.member.user.id}\``,
          color: 0x272783,
        },
      ],
    },
  });
}

export async function CardsCommand(body: DiscordInteraction, response: CraftedResponse) {
  return response.status(200).send({
    type: 4,
    data: {
      flags: 1 << 6,
      embeds: [
        {
          title: 'Lanyard Cards and Visualizers',
          description: `Here are the links to some Lanyard visualizers and direct links to your lanyard profile on them\n\n[Lanyard Profile Readme by cnrad](https://github.com/cnrad/lanyard-profile-readme) | [Your card](https://lanyard.cnrad.dev/api/${body.member.user.id})\n[Lanyard Visualizer by EGGSY](https://github.com/eggsy/lanyard-visualizer) | [Your card](https://lanyard-visualizer.netlify.app/user/${body.member.user.id})\n\n*If there are any other visualizers you want added to this list let <@156114103033790464> know.*`,
          color: 0x893012,
        },
      ],
    },
  });
}

export async function ProjectsCommand(body: DiscordInteraction, response: CraftedResponse) {
  const readme = await pullLanyardReadme();
  return response.status(200).send({
    type: 4,
    data: {
      flags: 1 << 6,
      embeds: [
        {
          title: 'Lanyard Community Projects',
          description: `The Lanyard community has worked on some pretty cool projects that allows you to extend the functionality of Lanyard. [PR to add a project](https://github.com/Phineas/lanyard)!\n\n${readme.communityProjects
            .map((item) => `${item.link}\n${item.description}`)
            .join('\n\n')}`,
          color: 0x392812,
        },
      ],
    },
  });
}

export async function WebsitesCommand(body: DiscordInteraction, response: CraftedResponse) {
  const readme = await pullLanyardReadme();
  return response.status(200).send({
    type: 4,
    data: {
      flags: 1 << 6,
      embeds: [
        {
          title: 'Websites that use Lanyard',
          description: `Below is a list of sites using Lanyard right now, check them out! A lot of them will only show an activity when they're active. [Create a PR to add your site](https://github.com/Phineas/lanyard)!\n\n${readme.websites.join(
            '\n',
          )}`,
          color: 0x298938,
        },
      ],
    },
  });
}
