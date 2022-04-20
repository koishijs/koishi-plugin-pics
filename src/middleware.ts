import { Awaitable, Logger } from 'koishi';
import { PicMiddlewareConfig, PicMiddlewareInfo } from './config';
import {
  BasePlugin,
  Inject,
  InjectLogger,
  LifecycleEvents,
} from 'koishi-thirdeye';
import PicsContainer from './index';

export type PicNext = (url?: string) => Awaitable<string>;

export interface PicMiddleware extends PicMiddlewareInfo {
  use(url: string, next: PicNext): Awaitable<string>;
}

export class PicMiddlewareBase<
    C extends PicMiddlewareConfig = PicMiddlewareConfig,
  >
  extends BasePlugin<C>
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
