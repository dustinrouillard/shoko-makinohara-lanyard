import { UserCommand, CardsCommand, WebsitesCommand, ProjectsCommand } from './methods/commands';

export const Commands = [
  { command: 'user', function: UserCommand },
  { command: 'cards', function: CardsCommand },
  { command: 'projects', function: ProjectsCommand },
  { command: 'websites', function: WebsitesCommand },
];
