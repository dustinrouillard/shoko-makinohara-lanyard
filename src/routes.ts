import Route from 'route-parser';

import { Base } from './methods/base';
import { Interaction } from './methods/interaction';
import { LanyardPrivacy, LanyardTerms, Privacy, Terms } from './methods/legal';
import { Metrics } from './methods/metrics';
import { AllStats, CommandStats, TrackGuilds } from './methods/stats';
import { Internal } from './middlewares/internal';
import { Verification } from './middlewares/verification';

import { RouteDefinition } from './types/Routes';

export const routes: RouteDefinition[] = [
  { route: new Route('/'), method: 'GET', handler: Base },

  { route: new Route('/terms'), method: 'GET', handler: Terms },
  { route: new Route('/privacy'), method: 'GET', handler: Privacy },

  { route: new Route('/lanyard/terms'), method: 'GET', handler: LanyardTerms },
  { route: new Route('/lanyard/privacy'), method: 'GET', handler: LanyardPrivacy },

  { route: new Route('/stats'), method: 'GET', handler: AllStats },
  { route: new Route('/metrics'), method: 'GET', handler: Metrics },

  { route: new Route('/stats/guild/:type'), method: 'POST', handler: TrackGuilds, middlewares: [Internal] },
  { route: new Route('/stats/:name'), method: 'GET', handler: CommandStats },

  { route: new Route('/interaction'), method: 'POST', handler: Interaction, middlewares: [Verification] },
];
