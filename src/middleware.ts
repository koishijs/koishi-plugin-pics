import { Awaitable, Logger } from 'koishi';
import { PicMiddlewareConfig } from './config';
import {
  BasePlugin,
  CreatePluginFactory,
  Inject,
  InjectLogger,
  LifecycleEvents,
} from 'koishi-thirdeye';
import PicsContainer from './index';
import { PicMiddleware, PicNext } from './def';

export class BasePicMiddlewarePlugin
  extends BasePlugin<PicMiddlewareConfig>
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
