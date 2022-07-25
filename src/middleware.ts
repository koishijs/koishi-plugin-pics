import { Awaitable, Context, Logger, Schema } from 'koishi';
import { PicMiddlewareConfig } from './config';
import {
  CreatePluginFactory,
  Inject,
  InjectLogger,
  LifecycleEvents,
  PartialDeep,
  Reusable,
  schemaFromClass,
  StarterPlugin,
} from 'koishi-thirdeye';
import PicsContainer, { PicMiddlewareInfo } from './index';
import { PicMiddleware, PicNext } from './def';

@Reusable()
export class BasePicMiddlewarePlugin
  extends StarterPlugin(PicMiddlewareConfig)
  implements PicMiddleware, LifecycleEvents
{
  @Inject(true)
  protected pics: PicsContainer;

  @InjectLogger()
  protected logger: Logger;

  onApply() {
    this.config.applyTo(this);
    this.pics.middleware(this);
  }

  use(url: string, next: PicNext): Awaitable<string> {
    return next(url);
  }
}

export const PicMiddlewarePlugin = CreatePluginFactory(
  BasePicMiddlewarePlugin,
  PicMiddlewareConfig,
);

export function PlainPicMiddlewarePlugin<C>(dict: {
  [K in keyof C]: Schema<C[K]>;
}) {
  const Config = schemaFromClass(PicMiddlewareConfig) as unknown as Schema<
    PartialDeep<PicMiddlewareConfig & C>,
    PicMiddlewareConfig & C
  >;
  Object.assign(Config.dict, dict);
  return class PlainPicMiddlewarePluginBase implements PicMiddleware {
    name?: string;
    prepend?: boolean;
    config: PicMiddlewareInfo & C;
    static Config = Config;
    static using = ['pics'] as const;
    static reusable = true;
    constructor(
      public ctx: Context,
      config: PartialDeep<C & PicMiddlewareInfo>,
    ) {
      this.config = config as PicMiddlewareInfo & C;
      this.name = config.name;
      this.prepend = config.prepend;
      ctx.pics.middleware(this);
    }

    use(url: string, next: PicNext): Awaitable<string> {
      return next(url);
    }
  };
}
