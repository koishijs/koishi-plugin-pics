import 'source-map-support/register';
import { Context } from 'koishi';
import { PicsPlugin } from './plugin';
import { PicsPluginConfig } from './config';
export * from './config';
export * from './plugin';

Context.service('pics');

export const name = 'pics';
const plugin = new PicsPlugin();
export const schema = plugin.schema;
export function apply(ctx: Context, config: PicsPluginConfig) {
  ctx.plugin(plugin, config);
}
