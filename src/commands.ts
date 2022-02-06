import { UserCommand, CardsCommand, WebsitesCommand, ProjectsCommand, SourceCommand, BannerCommand } from './methods/commands';

export const Commands = [
  { command: 'user', function: UserCommand },
  { command: 'cards', function: CardsCommand },
  { command: 'projects', function: ProjectsCommand },
  { command: 'websites', function: WebsitesCommand },
  { command: 'source', function: SourceCommand },
  { command: 'banners', function: BannerCommand },
  { command: 'bios', function: BannerCommand },
];
