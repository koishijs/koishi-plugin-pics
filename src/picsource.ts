import { Context, Awaitable, Logger, Plugin } from 'koishi';
import {
  PartialDeep,
  InjectConfig,
  Inject,
  InjectLogger,
  BasePlugin,
  ClassType,
  DefinePlugin,
  LifecycleEvents,
} from 'koishi-thirdeye';
import PicsContainer from '.';
import { PicSourceConfig } from './config';
import {
  PicSourceInfo,
  PicResult,
  Instances,
  ToInstancesConfig,
  ClonePlugin,
} from './def';

export class PicSource implements PicSourceInfo {
  constructor(protected ctx: Context) {}
  tags: string[] = [];
  weight = 1;
  name = 'default';
  description = '';
  isDefault = false;
  randomPic(picTags: string[]): Awaitable<PicResult> {
    // For override
    throw new Error(`Not implemented`);
  }

  onStartup(): Awaitable<void> {
    return;
  }
  onShutdown(): Awaitable<void> {
    return;
  }
  getDisplayString() {
    let pattern = this.name;
    if (this.tags.length) {
      pattern += `\t标签: ${this.tags.join(',')}`;
    }
    if (this.description) {
      pattern += `\t${this.description}`;
    }
    return pattern;
  }
}

export class PicSourcePlugin<
  C extends PicSourceConfig = PicSourceConfig,
> extends PicSource {
  constructor(ctx: Context, config: PartialDeep<C>) {
    super(ctx);
  }

  @InjectConfig()
  protected config: C;

  @Inject(true)
  protected pics: PicsContainer;

  @InjectLogger()
  protected logger: Logger;

  onApply() {
    this.config.applyTo(this);
    this.pics.addSource(this);
  }
}

export class MultiPicSourcePlugin<C extends PicSourceConfig>
  extends BasePlugin<Instances<C>>
  implements LifecycleEvents
{
  @Inject(true)
  protected pics: PicsContainer;

  @InjectLogger()
  protected logger: Logger;

  getSourcePlugin(): new (ctx: Context, config: any) => PicSourcePlugin<C> {
    throw new Error(`Not implemented`);
  }

  registerSourceInstances() {
    const sourcePlugin = this.getSourcePlugin();
    for (const instanceConfig of this.config.instances) {
      const clonedSourcePlugin = ClonePlugin(
        sourcePlugin,
        `${instanceConfig.name}-${instanceConfig.name}`,
      );
      this.ctx.plugin(clonedSourcePlugin, instanceConfig);
    }
  }

  onApply() {
    this.registerSourceInstances();
  }
}

export function DefineMultiSourcePlugin<
  C extends PicSourceConfig,
  P extends PicSourcePlugin<C>,
>(
  SourcePlugin: new (ctx: Context, config: C) => P,
  SourceConfig: ClassType<C>,
  name = SourcePlugin.name,
): new (
  context: Context,
  config: Instances<PartialDeep<C>>,
) => MultiPicSourcePlugin<C> {
  const pluginClass = class SpecificMultiPicSourcePlugin extends MultiPicSourcePlugin<C> {
    getSourcePlugin() {
      return SourcePlugin;
    }
  };

  return DefinePlugin({
    name,
    schema: ToInstancesConfig(SourceConfig),
  })(pluginClass);
}
