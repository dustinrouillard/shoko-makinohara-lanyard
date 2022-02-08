import Route from 'route-parser';

import { Base } from './methods/base';
import { Interaction } from './methods/interaction';
import { AllStats, CommandStats } from './methods/stats';
import { Verification } from './middlewares/verification';

import { RouteDefinition } from './types/Routes';

export const routes: RouteDefinition[] = [
  { route: new Route('/'), method: 'GET', handler: Base },

  { route: new Route('/stats'), method: 'GET', handler: AllStats },
  { route: new Route('/stats/:name'), method: 'GET', handler: CommandStats },

  { route: new Route('/interaction'), method: 'POST', handler: Interaction, middlewares: [Verification] },
];
